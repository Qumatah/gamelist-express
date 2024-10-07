# Install

npm install

This question has more than 30 answers, most suggesting to either downgrade Node.js to pre v17 or to use the legacy SSL provider. Both of those solutions are hacks that leave your builds open to security threats.

Reason For The Error
In Node.js v17, the Node.js developers closed a security hole in the SSL provider. This fix was a breaking change that corresponded with similar breaking changes in the SSL packages in NPM. When you attempt to use SSL in Node.js v17 or later without also upgrading those SSL packages in your package.json, then you will see this error.

The Correct (safe) Solution (for npm users)
Use an up-to-date version of Node.js, and also use packages that are up-to-date with security fixes.

You can first try an update to see if that solves the problem:

npm update
If that is not enough, for many people, the following command will fix the issue:

npm audit fix --force
However, be aware that, for complex builds, the above command will pull in breaking security fixes that can potentially break your build.

Note for Yarn users
Yarn users can use yarn-audit-fix which can be run without installing as a dependency via

npm_config_yes=true npx yarn-audit-fix
or windows powershell:

$env:npm_config_yes = 1; npx yarn-audit-fix
A less heavy-handed (also correct) solution for Webpack
In your Webpack config, set either of the following: (See the ouput.hashFunction docs)

A. (Webpack v5) Set output.hashFunction = 'xxhash64'.
B. (Webpack v4) This will depend on what hash algorithms nodejs supports on your system. Some common options you can try are output.hashFunction = 'sha512' or output.hashFunction = 'sha256'.

# deploy

npm run deploy
