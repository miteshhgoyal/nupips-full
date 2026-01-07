// Define route-to-permission mapping
const routePermissionMap = {
    '/dashboard': 'dashboard',
    '/deposits': 'deposits',
    '/withdrawals': 'withdrawals',
    '/income-expense': 'system-incomes',
    '/products': 'products',
    '/orders': 'orders',
    '/competition': 'competition',
    '/gtc-members': 'gtc-members',
    '/users': 'users',
    '/courses': 'courses',
    '/system-config': 'system-configuration',
    '/subadmins': 'subadmins'
};

// Automatic permission checker based on route
export const autoCheckPermission = (req, res, next) => {
    // Admin has access to everything
    if (req.user.userType === 'admin') {
        return next();
    }

    // Subadmin needs permission check
    if (req.user.userType === 'subadmin') {
        // Get the base path from request URL
        const basePath = '/' + req.path.split('/')[1];
        const requiredPermission = routePermissionMap[basePath];

        // If route is not in the map, allow by default (can be changed to deny)
        if (!requiredPermission) {
            return next();
        }

        // Check if subadmin has permission
        if (req.user.permissions?.pages?.includes(requiredPermission)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to access this resource.',
            requiredPermission
        });
    }

    // Other user types are not allowed
    return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or subadmin access required.'
    });
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

// Manual permission checker (for specific cases)
export const checkPermission = (requiredPage) => {
    return (req, res, next) => {
        if (req.user.userType === 'admin') {
            return next();
        }

        if (req.user.userType === 'subadmin') {
            if (req.user.permissions?.pages?.includes(requiredPage)) {
                return next();
            }
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to access this page.',
                requiredPermission: requiredPage
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or subadmin access required.'
        });
    };
};
