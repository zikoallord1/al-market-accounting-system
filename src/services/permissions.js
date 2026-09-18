export const ROLE_PERMISSIONS={
 cashier:['sales','customers','reports'],
 manager:['sales','purchases','items','inventory','customers','suppliers','finance','employees','reports','cameras'],
 admin:['*']
};
export function hasPermission(user,permission){
 if(!user?.active)return false;
 const permissions=user.permissions||ROLE_PERMISSIONS[user.role]||[];
 return permissions.includes('*')||permissions.includes(permission);
}
export function currentUser(state){return (state.users||[]).find(u=>u.id===(state.currentUserId||'owner'))||(state.users||[])[0]||null}
export function permissionForModule(name){
 return {'المبيعات':'sales','المشتريات':'purchases','الأصناف':'items','المخزون':'inventory','العملاء':'customers','الموردون':'suppliers','المالية':'finance','الموظفون':'employees','التقارير':'reports','الكاميرات والمراقبة':'cameras','الإعدادات':'settings'}[name]||name;
}
export function canAccessModule(state,name){
 const user=currentUser(state);return name==='الإعدادات'?hasPermission(user,'settings'):hasPermission(user,permissionForModule(name));
}
