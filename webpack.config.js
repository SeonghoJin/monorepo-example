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

    const plugins = [];

    const makeConfig = (entry, isProduction) => ({
        entry,
        mode: isProduction ? 'production' : 'development'
    });

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
        let entry = path.resolve(pkg.dir,'src/index.js');

        result.push({
                ...makeConfig(entry, isProduction),
                output: {
                    filename: main,
                    path: path.resolve(__dirname, basePath),
                    library: {
                        name: pkg.name,
                        type: 'umd',
                    },
                },
            }
        );

        result.push({
            ...makeConfig(entry, isProduction),
            experiments: {
                outputModule: true,
            },
            output: {
                filename: module,
                path: path.resolve(__dirname, basePath),
                library: {
                    type: 'module',
                },
            },
        })

    })

    return result;
};
