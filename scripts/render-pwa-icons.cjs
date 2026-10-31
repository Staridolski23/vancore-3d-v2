// Rasterize the existing repository-native vector favicon for manifest/Apple use.
const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs/promises');
(async()=>{
  const publicPath=path.join(__dirname,'../public');
  const svg=await fs.readFile(path.join(publicPath,'favicon.svg'));
  for(const size of [192,512]){
    const output=path.join(publicPath,'icons',`icon-${size}.png`);
    await sharp(svg,{density:Math.ceil(size/32*72)}).resize(size,size).png().toFile(output);
    const metadata=await sharp(output).metadata();
    if(metadata.width!==size||metadata.height!==size||metadata.format!=='png')throw Error('Invalid generated icon');
    console.log(JSON.stringify({file:path.basename(output),width:metadata.width,height:metadata.height}));
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
