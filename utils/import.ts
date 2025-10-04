import { OfficerRecord, UrgencyLevel, TrainingRecord, CapabilityRating, PerformanceRatingLevel, CurrentScoreCategory, EstablishmentRecord, AgencyType } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { getGradingGroup } from './helpers';

// Make XLSX available from the global scope (loaded via script tag)
declare const XLSX: any;

// --- MAPPING CONFIGURATION ---
// Maps OfficerRecord fields to possible column header names in the Excel file.
// Uses lowercase for case-insensitive matching to make the import more robust.
// More specific aliases are listed first to ensure they are matched first.
const HEADER_MAPPING: Record<keyof Omit<OfficerRecord, 'capabilityRatings' | 'performanceRatingLevel' | 'misalignmentFlag' | 'gradingGroup'>, string[]> = {
    email: ['email address', 'e-mail', 'email'],
    name: ['full name', 'officer name', 'name', 'occupant', 'i1'],
    position: ['job title', 'position', 'role', 'designation', 'i4'],
    positionNumber: ['position no.', 'position no', 'position number', 'pos no.', 'pos no', 'position id'],
    division: ['business unit', 'division', 'department', 'directorate', 'division/section', 'i6'],
    grade: ['position grade', 'job grade', 'grade', 'level', 'classification', 'i5'],
    spaRating: ['spa rating', 'performance rating', 'spa score', 'most attained spa rating', 'spa', 'i12'],
    technicalCapabilityGaps: ['technical capability gaps', 'technical gaps'],
    leadershipCapabilityGaps: ['leadership capability gaps', 'leadership gaps'],
    ictSkills: ['ict skills', 'it skills'],
    trainingHistory: ['training history', 'completed training'],
    trainingPreferences: ['training preferences', 'learning preferences'],
    urgency: ['urgency level', 'urgency'],
    // FIX: Add missing nextTrainingDueDate to the header mapping.
    nextTrainingDueDate: ['next training due date', 'training due date', 'next training due'],
    age: ['age', 'i2'],
    gender: ['gender', 'sex'],
    dateOfBirth: ['date of birth', 'dob', 'i3'],
    jobQualification: ['job qualification', 'qualification', 'highest qualification', 'i8', 'i11'],
    commencementDate: ['commencement date', 'start date', 'i10'],
    yearsOfExperience: ['years of experience', 'experience', 'i9'],
    employmentStatus: ['employment status', 'status', 'i7'],
    fileNumber: ['file number', 'filenumber'],
    // New TNA fields
    tnaProcessExists: ['h1'],
    tnaAssessmentMethods: ['h3'],
    tnaProcessDocumented: ['h4'],
    tnaDesiredCourses: ['h7'],
    tnaInterestedTopics: ['h8'],
    tnaPriorities: ['h9'],
};

// --- HELPER FUNCTIONS ---

const findHeader = (headers: string[], possibleNames: string[]): string | null => {
    const trimmedHeaders = headers.map(h => String(h || '').trim());
    for (const name of possibleNames) {
        try {
            // Use a case-insensitive regex with word boundaries to avoid partial matches on other words.
            // e.g., doesn't match 'name' in 'domain name', but does in 'officer name' or 'name'.
            // This is more robust than a simple .includes() check.
            const escapedName = name.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            const regex = new RegExp(`\\b${escapedName}\\b`, 'i');
            const foundIndex = trimmedHeaders.findIndex(h => regex.test(h));
            if (foundIndex > -1) {
                return headers[foundIndex]; // Return original header name
            }
        } catch (e) {
            // Fallback for any unexpected regex issues.
            console.error(`Regex error for name: ${name}`, e);
            const lowerName = name.toLowerCase();
            const foundIndex = trimmedHeaders.findIndex(h => h.toLowerCase().includes(lowerName));
            if (foundIndex > -1) {
                return headers[foundIndex];
            }
        }
    }
    return null;
};

const parseArrayString = (value: any): string[] => {
    if (typeof value !== 'string' || !value.trim()) return [];
    return value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
};

const parseBoolean = (value: any): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lowerVal = value.trim().toLowerCase();
        if (lowerVal === 'yes' || lowerVal === 'true' || lowerVal === '1') return true;
        if (lowerVal === 'no' || lowerVal === 'false' || lowerVal === '0') return false;
    }
    return undefined;
};

const parseTrainingHistory = (value: any): TrainingRecord[] => {
    if (typeof value !== 'string' || !value.trim()) return [];
    const records: TrainingRecord[] = [];
    const entries = value.split(',');
    const regex = /(.*) \((....-..-..)\)/;

    for (const entry of entries) {
        const match = entry.trim().match(regex);
        if (match) {
            records.push({ courseName: match[1].trim(), completionDate: match[2].trim() });
        } else {
            // Fallback for entries without a date
            records.push({ courseName: entry.trim(), completionDate: 'N/A' });
        }
    }
    return records;
};

const getPerformanceRatingLevel = (spaRating: string): PerformanceRatingLevel => {
    const rating = parseInt(spaRating, 10);
    if (isNaN(rating)) return 'Not Rated';
    switch (rating) {
        case 5: return 'Well Above Required';
        case 4: return 'Above Required';
        case 3: return 'At Required Level';
        case 2: return 'Below Required Level';
        case 1: return 'Well Below Required Level';
        default: return 'Not Rated';
    }
};

const getCurrentScoreCategory = (score: number): CurrentScoreCategory => {
    if (score >= 8) return 'High';
    if (score >= 5) return 'Moderate';
    return 'Low';
};

// --- CORE PROCESSING LOGIC ---

/**
 * Processes a standardized array of data objects into OfficerRecords.
 * @param jsonData - Array of objects where keys are header names.
 * @param headers - Array of header strings.
 * @param agencyType - The type of agency for applying correct grading logic.
 * @returns An object containing the parsed data, a preview, and the headers.
 * @throws An error if validation fails.
 */
const processParsedData = (jsonData: any[], headers: string[], agencyType: AgencyType): { data: OfficerRecord[], preview: any[], headers: string[] } => {
    if (jsonData.length === 0) {
        throw new Error('The imported data is empty or contains no data rows.');
    }

    const requiredHeaderKeys: (keyof OfficerRecord)[] = ['name', 'division', 'grade', 'position'];
    const missingHeaders = requiredHeaderKeys.filter(rh => !findHeader(headers, HEADER_MAPPING[rh as keyof typeof HEADER_MAPPING]));
    
    if (missingHeaders.length > 0) {
        throw new Error(`The data is missing required columns. Please ensure it contains headers for: ${missingHeaders.join(', ')}.`);
    }

    const resolvedHeaders: Partial<Record<keyof Omit<OfficerRecord, 'capabilityRatings' | 'performanceRatingLevel' | 'misalignmentFlag' | 'gradingGroup'>, string>> = {};
    for (const key in HEADER_MAPPING) {
        const headerKey = key as keyof typeof HEADER_MAPPING;
        const found = findHeader(headers, HEADER_MAPPING[headerKey]);
        if (found) {
            resolvedHeaders[headerKey] = found;
        }
    }
    
    // This regex identifies capability rating columns (A-G, plus H2, H5, H6) based on the new questionnaire format.
    const ratingHeaderRegex = /^(?:[A-G][0-9]{1,2}|H[256])$/i;
    const ratingHeaders = headers.filter(h => ratingHeaderRegex.test(String(h || '').trim()));


    const officerRecords: OfficerRecord[] = jsonData.map((row) => {
        const get = (key: keyof typeof HEADER_MAPPING) => row[resolvedHeaders[key]!] ?? '';

        const urgencyValue = String(get('urgency') || 'Low').trim();
        const urgency = Object.values(UrgencyLevel).includes(urgencyValue as UrgencyLevel) 
            ? (urgencyValue as UrgencyLevel) 
            : UrgencyLevel.Low;
        
        const spaRating = String(get('spaRating')).trim();
        const grade = String(get('grade')).trim();
        const performanceRatingLevel = getPerformanceRatingLevel(spaRating);
        const gradingGroup = getGradingGroup(grade, agencyType);

        const capabilityRatings: CapabilityRating[] = [];
        ratingHeaders.forEach(header => {
            const currentScoreValue = row[header];
            if (currentScoreValue !== null && currentScoreValue !== undefined && String(currentScoreValue).trim() !== '') {
                const currentScore = parseFloat(String(currentScoreValue));
                if (!isNaN(currentScore) && currentScore >= 0 && currentScore <= 10) {
                    const gapScore = 10 - currentScore;
                    let gapCategory: 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap';
                    if (gapScore <= 1) {
                        gapCategory = 'No Gap';
                    } else if (gapScore === 2) {
                        gapCategory = 'Minor Gap';
                    } else if (gapScore >= 3 && gapScore <= 5) {
                        gapCategory = 'Moderate Gap';
                    } else { // gapScore >= 6
                        gapCategory = 'Critical Gap';
                    }
                    
                    const currentScoreCategory = getCurrentScoreCategory(currentScore);
                    
                    capabilityRatings.push({
                        questionCode: String(header).trim().toUpperCase(),
                        currentScore,
                        realisticScore: 10,
                        gapScore,
                        gapCategory,
                        currentScoreCategory,
                    });
                }
            }
        });

        // Misalignment Logic
        const spaRatingNum = parseInt(spaRating, 10);
        const avgCapabilityScore = capabilityRatings.length > 0
            ? capabilityRatings.reduce((sum, r) => sum + r.currentScore, 0) / capabilityRatings.length
            : -1;

        let misalignmentFlag: string | undefined = undefined;
        if (avgCapabilityScore !== -1 && !isNaN(spaRatingNum)) {
            if ((spaRatingNum === 4 || spaRatingNum === 5) && avgCapabilityScore < 5) {
                misalignmentFlag = "High performer, low self-assessed capability – possible overcompensation or workload mismatch.";
            } else if ((spaRatingNum === 1 || spaRatingNum === 2) && avgCapabilityScore > 7) {
                misalignmentFlag = "Skilled staff underperforming – possible motivation or supervision issue.";
            }
        }

        return {
            email: String(get('email')).trim(),
            name: String(get('name')).trim(),
            position: String(get('position')).trim(),
            division: String(get('division')).trim(),
            grade,
            gradingGroup,
            positionNumber: String(get('positionNumber')).trim() || undefined,
            spaRating,
            performanceRatingLevel,
            capabilityRatings,
            misalignmentFlag,
            technicalCapabilityGaps: parseArrayString(get('technicalCapabilityGaps')),
            leadershipCapabilityGaps: parseArrayString(get('leadershipCapabilityGaps')),
            ictSkills: parseArrayString(get('ictSkills')),
            trainingHistory: parseTrainingHistory(get('trainingHistory')),
            trainingPreferences: parseArrayString(get('trainingPreferences')),
            urgency,
            nextTrainingDueDate: String(get('nextTrainingDueDate')).trim() || undefined,
            age: parseInt(get('age'), 10) || undefined,
            gender: String(get('gender')).toLowerCase() === 'male' ? 'Male' : String(get('gender')).toLowerCase() === 'female' ? 'Female' : undefined,
            dateOfBirth: String(get('dateOfBirth')).trim() || undefined,
            jobQualification: String(get('jobQualification')).trim() || undefined,
            commencementDate: String(get('commencementDate')).trim() || undefined,
            yearsOfExperience: parseInt(get('yearsOfExperience'), 10) || undefined,
            employmentStatus: String(get('employmentStatus')).trim() || undefined,
            fileNumber: String(get('fileNumber')).trim() || undefined,
            tnaProcessExists: parseBoolean(get('tnaProcessExists')),
            tnaAssessmentMethods: parseArrayString(get('tnaAssessmentMethods')),
            tnaProcessDocumented: parseBoolean(get('tnaProcessDocumented')),
            tnaDesiredCourses: String(get('tnaDesiredCourses')).trim() || undefined,
            tnaInterestedTopics: parseArrayString(get('tnaInterestedTopics')),
            tnaPriorities: String(get('tnaPriorities')).trim() || undefined,
        };
    });

    if (officerRecords.length === 0) {
        throw new Error('No valid officer records could be parsed. Check that required columns (name, division, grade, position) are populated.');
    }

    return {
        data: officerRecords,
        preview: jsonData.slice(0, 60),
        headers: headers
    };
};

// --- PDF PARSING LOGIC ---

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64String = result.split(',')[1];
            if (base64String) {
                resolve(base64String);
            } else {
                reject(new Error("Could not convert file to base64."));
            }
        };
        reader.onerror = error => reject(error);
    });
};

const parseCnaPdfWithGemini = async (file: File, agencyType: AgencyType): Promise<{ data: OfficerRecord[], preview: any[], headers: string[] }> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured to parse PDF files. Please set the API_KEY environment variable.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await fileToBase64(file);

    const pdfExtractionPrompt = `You are a high-precision data extraction engine. Your task is to extract tabular data from a PDF document.

**CRITICAL RULES:**
1.  **EXTRACTION MODE**: You MUST use structured table parsing. Your primary goal is to recognize and reconstruct the entire table, preserving its grid format precisely.
2.  **HEADER RECOGNITION**: The table's headers will be **question codes** (e.g., A1, B3, G10). Correctly identify this header row.
3.  **FULL DOCUMENT SCAN**: Scan all pages. If a single table wraps across multiple pages or columns, you MUST reconstruct it into one complete, unified dataset.
4.  **DATA INTEGRITY**:
    - Extract **all rows** (up to 60) and **all columns** (up to 500). Do not skip any.
    - Trim leading/trailing whitespaces from all cells.
    - Represent empty or blank cells as an empty string ("").
    - Preserve the original data type where possible (numbers, text). Return all values as strings in the final JSON.
5.  **OUTPUT FORMAT**: The entire response MUST be a single JSON object with one key: "data". The value for "data" must be a JSON array of arrays. The first inner array must be the headers (question codes), followed by all data rows. Do NOT add any explanatory text, comments, or markdown.

**VALIDATION & ERROR HANDLING:**
- If the document does **not contain a structured table** with the described format, you MUST return a JSON object with a single key "error" and the value "No structured table found. Please upload a table-formatted PDF or Excel file with question codes as headers."`;
    
    const pdfExtractionSchema = {
        type: Type.OBJECT,
        properties: {
            data: {
                type: Type.ARRAY,
                description: "An array of arrays representing the table. First inner array is the header row. Subsequent arrays are data rows.",
                items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            error: {
                type: Type.STRING,
                description: "An error message if no valid table is found."
            }
        },
    };

    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data,
      },
    };
    const textPart = { text: pdfExtractionPrompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [pdfPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: pdfExtractionSchema,
        },
    });

    const responseText = response.text.trim();
    let parsedObject: { data?: string[][], error?: string };
    try {
        parsedObject = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini for PDF extraction:", responseText, e);
        const errorMessage = e instanceof Error ? e.message : "The AI returned an unexpected format.";
        throw new Error(`The AI failed to return valid JSON for the PDF. ${errorMessage}`);
    }
    
    if (parsedObject.error) {
        throw new Error(parsedObject.error);
    }

    if (!parsedObject.data || !Array.isArray(parsedObject.data) || parsedObject.data.length < 2) {
        throw new Error("Uploaded document is incomplete or malformed. The AI could not find a valid data table.");
    }
    
    let headers = parsedObject.data[0];
    let rows = parsedObject.data.slice(1);
    
    const headerCount = headers.length;
    if (headerCount === 0) {
        throw new Error("The AI extracted a table with no columns. The document might be empty or in an unsupported layout.");
    }
    
    rows = rows.map((row, index) => {
        if (row.length !== headerCount) {
            console.warn(`Row ${index + 1} has an inconsistent column count (${row.length}). Correcting to match header count of ${headerCount} columns.`);
            const correctedRow = [...row];
            // Pad if too short
            while (correctedRow.length < headerCount) {
                correctedRow.push(''); 
            }
            // Trim if too long
            return correctedRow.slice(0, headerCount);
        }
        return row;
    });

    const jsonData = rows.map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
    
    console.log(`PDF Extraction Success:
- Filename: ${file.name}
- Timestamp: ${new Date().toISOString()}
- Processed: ${rows.length} rows, ${headers.length} columns.`);


    return processParsedData(jsonData, headers, agencyType);
};

// --- NEW for Establishment File ---
const ESTABLISHMENT_HEADER_MAPPING: Record<keyof EstablishmentRecord, string[]> = {
    positionNumber: ['position number', 'position no.', 'pos no'],
    division: ['division', 'department', 'business unit', 'description', 'descriptions'],
    grade: ['grade', 'level', 'classification', 'class'],
    designation: ['designation', 'position title', 'position', 'job title'],
    occupant: ['occupant', 'name', 'incumbent'],
    status: ['status', 'employment status']
};

export interface EstablishmentFileSummary {
    totalPositions: number;
    divisions: string[];
    levelSummary: Record<string, number>;
    vacantCount: number;
}

const processEstablishmentJson = (jsonData: any[], headers: string[], agencyType: AgencyType): { data: EstablishmentRecord[], summary: EstablishmentFileSummary } => {
    if (headers.length === 0 || jsonData.length === 0) {
        throw new Error("The selected establishment file is empty.");
    }
    
    const resolvedHeaders: Partial<Record<keyof EstablishmentRecord, string>> = {};
    for (const key in ESTABLISHMENT_HEADER_MAPPING) {
        const headerKey = key as keyof EstablishmentRecord;
        const found = findHeader(headers, ESTABLISHMENT_HEADER_MAPPING[headerKey]);
        if (found) {
            resolvedHeaders[headerKey] = found;
        }
    }
    
    const requiredHeaders: (keyof EstablishmentRecord)[] = ['positionNumber', 'designation', 'grade', 'division'];
    const missing = requiredHeaders.filter(h => !resolvedHeaders[h]);
    if (missing.length > 0) {
        throw new Error(`Establishment file is missing required columns: ${missing.join(', ')}`);
    }

    const establishmentRecords: EstablishmentRecord[] = jsonData.map(row => {
        const get = (key: keyof EstablishmentRecord) => row[resolvedHeaders[key]!] ?? '';
        const status = String(get('status')).trim() as EstablishmentRecord['status'];
        return {
            positionNumber: String(get('positionNumber')).trim(),
            division: String(get('division')).trim(),
            grade: String(get('grade')).trim(),
            designation: String(get('designation')).trim(),
            occupant: String(get('occupant')).trim(),
            status: ['Confirmed', 'Probation', 'Vacant', 'Other'].includes(status) ? status : 'Other',
        };
    });
    
    const levelSummary: Record<string, number> = { 'Junior Officer': 0, 'Senior Officer': 0, 'Manager': 0, 'Senior Management': 0, 'Other': 0 };
    establishmentRecords.forEach(rec => {
        const group = getGradingGroup(rec.grade, agencyType);
        levelSummary[group] = (levelSummary[group] || 0) + 1;
    });
    
    const summary: EstablishmentFileSummary = {
        totalPositions: establishmentRecords.length,
        divisions: [...new Set(establishmentRecords.map(r => r.division).filter(Boolean))],
        levelSummary,
        vacantCount: establishmentRecords.filter(r => r.status === 'Vacant').length,
    };

    return { data: establishmentRecords, summary };
};

const parseEstablishmentPdfWithGemini = async (file: File, agencyType: AgencyType): Promise<{ data: EstablishmentRecord[], summary: EstablishmentFileSummary }> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured to parse PDF files. Please set the API_KEY environment variable.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await fileToBase64(file);

    const establishmentPdfExtractionPrompt = `You are a data extraction expert. Your task is to extract tabular data from a PDF of an organizational establishment list.

**CRITICAL RULES:**
1.  **EXTRACTION MODE**: You MUST parse the document as a structured table. Your primary goal is to recognize and reconstruct the table, preserving its grid format.
2.  **HEADER RECOGNITION**: The table's headers will be variants of: "Position Number", "Division", "Grade", "Designation", "Occupant", and "Status". You MUST correctly identify this header row.
3.  **FULL DOCUMENT SCAN**: Scan all pages. If the table spans multiple pages, you MUST reconstruct it into a single, unified dataset.
4.  **DATA INTEGRITY**:
    - Extract **all rows** and **all columns**. Do not skip any.
    - Trim leading/trailing whitespaces from all cells.
    - Represent empty or blank cells as an empty string ("").
    - Preserve original data types but return all values as strings.
5.  **OUTPUT FORMAT**: The entire response MUST be a single JSON object with one key: "data". The value for "data" must be a JSON array of arrays. The first inner array must be the headers, followed by all data rows. Do NOT add any explanatory text, comments, or markdown.

**VALIDATION & ERROR HANDLING:**
- If the document does not contain a structured table in the described format, you MUST return a JSON object with a single key "error" and the value "No structured establishment table found in the PDF."`;
    
    const pdfExtractionSchema = {
        type: Type.OBJECT,
        properties: {
            data: {
                type: Type.ARRAY,
                description: "An array of arrays representing the table. First inner array is the header row. Subsequent arrays are data rows.",
                items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            error: {
                type: Type.STRING,
                description: "An error message if no valid table is found."
            }
        },
    };
    
    const pdfPart = { inlineData: { mimeType: 'application/pdf', data: base64Data } };
    const textPart = { text: establishmentPdfExtractionPrompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [pdfPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: pdfExtractionSchema,
        },
    });

    const responseText = response.text.trim();
    const parsedObject: { data?: string[][], error?: string } = JSON.parse(responseText);
    
    if (parsedObject.error) {
        throw new Error(parsedObject.error);
    }

    if (!parsedObject.data || !Array.isArray(parsedObject.data) || parsedObject.data.length < 2) {
        throw new Error("The AI could not find a valid data table in the establishment PDF.");
    }
    
    const headers = parsedObject.data[0];
    const jsonData = parsedObject.data.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });

    return processEstablishmentJson(jsonData, headers, agencyType);
};

const parseEstablishmentExcel = (file: File, agencyType: AgencyType): Promise<{ data: EstablishmentRecord[], summary: EstablishmentFileSummary }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                if (!e.target?.result) {
                    return reject(new Error('Failed to read establishment file.'));
                }
                const data = new Uint8Array(e.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                const headers: string[] = jsonData.length > 0 ? Object.keys(jsonData[0]) : (XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[] || []);
                resolve(processEstablishmentJson(jsonData, headers, agencyType));
            } catch (error) {
                const message = error instanceof Error ? error.message : 'The establishment file seems to be corrupted or in an unsupported format.';
                reject(new Error(message));
            }
        };
        reader.onerror = () => reject(new Error('An error occurred while reading the establishment file.'));
        reader.readAsArrayBuffer(file);
    });
};

export const parseEstablishmentFile = (file: File, agencyType: AgencyType): Promise<{ data: EstablishmentRecord[], summary: EstablishmentFileSummary }> => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
        return parseEstablishmentExcel(file, agencyType);
    } else if (fileName.endsWith('.pdf')) {
        return parseEstablishmentPdfWithGemini(file, agencyType);
    } else {
        return Promise.reject(new Error("Unsupported establishment file type. Please upload a .xlsx, .csv, or .pdf file."));
    }
};

// --- EXPORTED PARSING FUNCTIONS ---

/**
 * Parses an Excel file (.xlsx or .csv) or a PDF file and maps its content to OfficerRecord array.
 * @param file - The file to parse.
 * @param agencyType - The type of agency for applying correct grading logic.
 * @returns A promise that resolves with the parsed data or rejects with an error.
 */
export const parseCnaFile = (file: File, agencyType: AgencyType): Promise<{ data: OfficerRecord[], preview: any[], headers: string[] }> => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    if (!e.target?.result) {
                        return reject('Failed to read file.');
                    }
                    const data = new Uint8Array(e.target.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                    const headers: string[] = jsonData.length > 0 
                        ? Object.keys(jsonData[0]) 
                        : (XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[] || []);

                    if (headers.length === 0 && jsonData.length === 0) {
                        return reject(new Error("The selected sheet is empty."));
                    }

                    const result = processParsedData(jsonData, headers, agencyType);
                    resolve(result);
                } catch (error) {
                    console.error("File parsing error:", error);
                    const message = error instanceof Error ? error.message : 'The file seems to be corrupted or in an unsupported format. Please upload a valid .xlsx or .csv file.';
                    reject(message);
                }
            };
            reader.onerror = () => reject('An error occurred while reading the file.');
            reader.readAsArrayBuffer(file);
        });
    } else if (fileName.endsWith('.pdf')) {
        return parseCnaPdfWithGemini(file, agencyType);
    } else {
        return Promise.reject(new Error("Unsupported file type. Please upload a .xlsx, .csv, or .pdf file."));
    }
};

/**
 * Parses a string of pasted tab-separated data into an OfficerRecord array.
 * @param pastedText - The raw string data, typically from a spreadsheet.
 * @param agencyType - The type of agency for applying correct grading logic.
 * @returns A promise resolving with the parsed data, or rejecting with an error.
 */
export const parsePastedData = async (pastedText: string, agencyType: AgencyType): Promise<{ data: OfficerRecord[], preview: any[], headers: string[] }> => {
    if (!pastedText.trim()) {
        throw new Error("Pasted data is empty.");
    }

    const rows = pastedText.trim().split('\n').map(row => row.trim()).filter(Boolean);
    if (rows.length < 2) {
        throw new Error("Pasted data must contain a header row and at least one data row.");
    }
    
    const headers = rows[0].split('\t');
    const dataRows = rows.slice(1);

    const jsonData = dataRows.map(rowStr => {
        const values = rowStr.split('\t');
        const rowObj: Record<string, string> = {};
        headers.forEach((header, index) => {
            rowObj[header] = values[index] || '';
        });
        return rowObj;
    });

    return processParsedData(jsonData, headers, agencyType);
};