module.exports = {
    branches: [
        {
            name: "master",
            level: "minor",
            devDependencies: ["@zowe/imperative", "@zowe/cli"]
        },
        // {
        //     name: "zowe-v1-lts",
        //     level: "patch",
        //     devDependencies: ["@zowe/imperative", "@zowe/cli"]
        // },
        // {
        //     name: "next",
        //     prerelease: true,
        //     devDependencies: ["@zowe/imperative", "@zowe/cli"]
        // },
    ],
    plugins: [
        "@octorelease/changelog",
        ["@octorelease/npm", {
            aliasTags: {
                latest: ["next"]
            },
            pruneShrinkwrap: true
        }],
        ["@octorelease/github", {
            checkPrLabels: true
        }],
        "@octorelease/git"
    ]
};
