const fs = require("fs");
const cp = require('child_process');
const exec = cp.execSync;

fs.rmSync("node_modules/resolve/test/resolver/malformed_package_json", { recursive: true, force: true });
exec("npx rn-nodeify --hack");
exec("npx jetify");

hack("node_modules/metro-react-native-babel-preset/src/configs/main.js", (s) => {
    // extraPlugins.push([
    //     require("@babel/plugin-transform-react-jsx", {
    //       useBuiltIns: true,
    //     }),
    //   ]);
    return s.replace(
        /\[\s*require[(]("@babel[/]plugin-transform-react-jsx"),\s*([{].*?[}])\s*[)]\s*,?\s*\]/sg,
        '[require($1),$2]'
    )
})

hack([
    "node_modules/react-native-os/android/build.gradle",
    "node_modules/react-native-tcp/android/build.gradle",
    "node_modules/react-native-udp/android/build.gradle",
], (s) => {
    // extraPlugins.push([
    //     require("@babel/plugin-transform-react-jsx", {
    //       useBuiltIns: true,
    //     }),
    //   ]);
    s = s.replace(
        /    compile /sg,
        '    implementation '
    )
    // compileSdkVersion safeExtGet('compileSdkVersion', 26)
    // buildToolsVersion safeExtGet('buildToolsVersion', '26.0.3')

    // defaultConfig {
    //     minSdkVersion safeExtGet('minSdkVersion', 19)
    //     targetSdkVersion safeExtGet('targetSdkVersion', 26)
    s = s.replace(
        /\b(compileSdkVersion|minSdkVersion|targetSdkVersion)\b.*/g,
        '$1 rootProject.ext.get("$1")'
    )

    s = s.replace(
        /\b(buildToolsVersion)\b.*/g,
        '// $0'
    )

    return s
})

if (fs.existsSync("node_modules/react-native-os/android/src/main/java/com/peel/react"))
    fs.renameSync(
        "node_modules/react-native-os/android/src/main/java/com/peel/react",
        "node_modules/react-native-os/android/src/main/java/com/peel/reactos"
    )
hack([
    "node_modules/react-native-os/android/src/main/java/com/peel/reactos/RNOSModule.java",
    "node_modules/react-native-tcp/android/src/main/java/com/peel/react/TcpSocketsModule.java",
], (s) => {
    return s.replace(
        /@Override(\s+[^(]*?createJSModules\(\))/sg,
        '$1'
    )
})

hack([
    "node_modules/react-native-os/android/src/main/java/com/peel/reactos/RNOS.java",
    "node_modules/react-native-os/android/src/main/java/com/peel/reactos/RNOSModule.java",
    "node_modules/react-native-os/android/src/main/AndroidManifest.xml",
], (s) => {
    return s.replace(
        /com\.peel\.react([;'"])/g,
        'com.peel.reactos$1'
    )
})

hack([
    "node_modules/metro-react-native-babel-transformer/src/index.js",
], (s) => {
    var rnd = function() {
        return JSON.stringify(require("crypto").randomBytes(20).toString('hex'));
    }
    s=s.replace('fs.readFileSync(__filename)',rnd)
    s=s.replace('require("babel-preset-fbjs/package.json").version',rnd)
    return s;
})


function hack(file, transform) {
    if (Array.isArray(file)) {
        for (const f of file) hack(f, transform)
        return;
    }
    let content = fs.readFileSync(file, { encoding: 'utf8' })
    let content2 = transform(content)
    if (content2 !== content) {
        console.log("hack " + file);
        fs.writeFileSync(file, content2);
    }
}