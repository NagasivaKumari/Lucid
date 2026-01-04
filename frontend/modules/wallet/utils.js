/**
 * Module: utils.js
 * Description: Frontend module for utils.js.
 */

export async function importModule(pkg) {
    try {
        return await import(pkg);
    } catch (err) {
        console.error('Module import failed:', pkg, err);
        throw err;
    }
}
