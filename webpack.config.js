const path = require('path');
const workspacesRun = require("workspaces-run");

module.exports = async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const compileTime = new Date().toUTCString();
    const packages = [];

    await workspacesRun.default(
        {cwd: __dirname, orderByDeps: true}, async (workspace) => {
            if(!workspace.config.private) {
                packages.push(workspace);
            }
        }
    );

    const result = [];

    packages.forEach((pkg) => {
        const {
            version,
            main,
            module
        } = pkg.config;

        let banner = [
            `/*!`,
            ` * ${pkg.name} - v${version}`,
            ` * Compiled ${compileTime}`,
        ].join('\n');

        const basePath = path.relative(__dirname, pkg.dir);
        const mainPath = path.join(basePath, main);
        const esPath = path.join(basePath, module);
        let entry = path.join(basePath, 'src/index.js');
        console.log(pkg);
        result.push({
            entry,
            output: {
                filename: main,
                path: path.resolve(__dirname, 'dist'),
                library: {
                    name: pkg.name,
                    type: 'umd',
                },
            },
            mode: isProduction ? 'production' : 'development'
        })
    })

    return result;
};
