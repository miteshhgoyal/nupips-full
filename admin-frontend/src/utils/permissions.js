// Map frontend routes to backend permission keys
const routeToPermissionMap = {
    '/dashboard': 'dashboard',
    '/deposits': 'deposits',
    '/withdrawals': 'withdrawals',
    '/system-incomes': 'system-incomes',
    '/products': 'products',
    '/orders': 'orders',
    '/competition': 'competition',
    '/gtc-members': 'gtc-members',
    '/users': 'users',
    '/courses': 'courses',
    '/system-configuration': 'system-configuration',
    '/subadmins': 'subadmins', // Added
};

export const hasPermission = (userType, permissions, route) => {
    // Admin has access to everything
    if (userType === 'admin') return true;

    // Subadmin needs permission check
    if (userType === 'subadmin') {
        const requiredPermission = routeToPermissionMap[route];
        if (!requiredPermission) return false;
        return permissions?.pages?.includes(requiredPermission);
    }

    // Other user types don't have admin access
    return false;
};

export const filterSidebarLinks = (sidebarLinks, userType, permissions) => {
    // Admin sees everything
    if (userType === 'admin') return sidebarLinks;

    // Filter for subadmin
    return sidebarLinks
        .map(link => {
            // If link has subItems, filter them
            if (link.subItems) {
                const filteredSubItems = link.subItems.filter(subItem =>
                    hasPermission(userType, permissions, subItem.href)
                );

                // Only show parent if it has visible children
                if (filteredSubItems.length > 0) {
                    return { ...link, subItems: filteredSubItems };
                }
                return null;
            }

            // For direct links, check permission
            if (link.href) {
                return hasPermission(userType, permissions, link.href) ? link : null;
            }

            return null;
        })
        .filter(Boolean); // Remove null entries
};
