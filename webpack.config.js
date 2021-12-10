const path = require('path');
const  webpack  = require('webpack');
const workspacesRun = require("workspaces-run");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");

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

    const makeConfig = (entry, isProduction, plugins) => ({
        entry,
        mode: isProduction ? 'production' : 'development',
        plugins
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

        const plugins = [
            new webpack.BannerPlugin(
                {banner}
            )
        ]

        result.push({
                ...makeConfig(entry, isProduction, plugins),
                plugins : [
                    ...plugins, new CleanWebpackPlugin()
                ],
                output: {
                    filename: main,
                    path: path.resolve(__dirname, basePath),
                    globalObject: 'globalThis',
                    library: {
                        name: pkg.name,
                        type: 'umd',
                    },
                },
            }
        );

        result.push({
            ...makeConfig(entry, isProduction, plugins),
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
