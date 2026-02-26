const employeeImageUrl = (path?: string): string => {
    const host = import.meta.env.VITE_APP_EMPLOYEE_IMAGE_URL;
    if (path) {
        return host.concat(path);
    } else {
        return host.concat('no-image');
    }
};

export { employeeImageUrl };
