module.exports = {
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'eudaimov',
                    name: 'XilefMap'
                },
                prerelease: false,
                draft: false
            }
        }
    ]
};