module.exports = {
    'extends': './node_modules/grumbler-scripts/config/.eslintrc-typescript.js',

    'rules': {
        'promise/no-native': 'off',
        'no-restricted-globals': 'off',
        '@typescript-eslint/no-floating-promises': 'off'
    }
};
