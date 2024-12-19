export function convertDatabaseTimestamp(givenDate) {
    let dob = givenDate || null;
    if (dob && dob.toDate) {
        dob = dob.toDate();
    } else if (dob && typeof dob === 'string') {
        dob = new Date(dob);
    }
    return dob;
}
