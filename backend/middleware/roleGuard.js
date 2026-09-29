/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * Restricts access to specific user roles
 * 
 * @param {string[]} allowedRoles - List of roles permitted to access the route
 */
function roleGuard(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED_ROLE',
        message: `Access denied. Role '${userRole}' is not authorized to perform this operation. Required role(s): [${allowedRoles.join(', ')}].`,
        userRole,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

module.exports = roleGuard;
