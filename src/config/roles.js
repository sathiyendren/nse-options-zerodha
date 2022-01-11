const allRoles = {
  user: ['getExpiryDate', 'manageExpiryDate', 'getOptionScripts', 'manageOptionScripts', 'getSetting', 'manageSetting'],
  admin: [
    'getUsers',
    'manageUsers',
    'getExpiryDate',
    'manageExpiryDate',
    'getOptionScripts',
    'manageOptionScripts',
    'getSetting',
    'manageSetting',
    'manageTransaction',
    'manageSymbolRate',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
