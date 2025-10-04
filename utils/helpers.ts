import { GradingGroup, AgencyType } from '../types';

export const getGradingGroup = (grade: string, agencyType: AgencyType): GradingGroup => {
    const gradeNumberMatch = grade.match(/\d+/);
    if (!gradeNumberMatch) return 'Other';

    const gradeNumber = parseInt(gradeNumberMatch[0], 10);

    // Specific logic for National Departments / Agencies
    if (agencyType === 'National Department' || agencyType === 'National Agency') {
        if (gradeNumber >= 7 && gradeNumber <= 12) return 'Junior Officer';
        if (gradeNumber >= 13 && gradeNumber <= 15) return 'Senior Officer';
        if (gradeNumber >= 16 && gradeNumber <= 17) return 'Manager';
        if (gradeNumber >= 18 && gradeNumber <= 20) return 'Senior Management';
    } 
    
    // Specific logic for Provincial Administration
    else if (agencyType === 'Provincial Administration') {
        if (gradeNumber >= 7 && gradeNumber <= 11) return 'Junior Officer';
        if (gradeNumber >= 12 && gradeNumber <= 14) return 'Senior Officer';
        if (gradeNumber >= 15 && gradeNumber <= 16) return 'Manager';
        if (gradeNumber >= 17 && gradeNumber <= 20) return 'Senior Management';
    }

    // A more comprehensive default logic for other agency types (Provincial Health Authority, Local Level Government, Other)
    // This is based on the National Department structure as a reasonable default.
    if (gradeNumber <= 12) {
        return 'Junior Officer';
    } else if (gradeNumber <= 15) {
        return 'Senior Officer';
    } else if (gradeNumber <= 17) {
        return 'Manager';
    } else if (gradeNumber >= 18) {
        return 'Senior Management';
    }

    return 'Other';
};
