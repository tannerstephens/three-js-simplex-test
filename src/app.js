import * as THREE from 'three';
import * as SimplexNoise from 'simplex-noise';

const constants = {
  terrainColors: [
    0xe5d9c2,
    0xb5ba61,
    0x7c8d4c,
    0x95a170,
    0xced6b6,
    0xfffafa
  ],
  waterColor: 0xb6d0e3,
};


class App {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();

    this.renderer.setSize(innerWidth, innerHeight);
  }

  display() {
    document.body.style.margin = 0;

    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.zIndex = -1;

    const root = document.getElementById('root');
    root.parentElement.replaceChild(this.renderer.domElement, root);
  }

  run() {
    const textureSize = 2048;

    const sphereGeometry = new THREE.SphereGeometry(30, 100, 100);

    const generateCanvasTexture = () => {
      const background = new THREE.TextureLoader().load('./assets/stars.jpg');
      this.scene.background = background;

      const simplex = new SimplexNoise(Math.random());

      const canvas = document.createElement('canvas');
      canvas.width = textureSize;
      canvas.height = textureSize;

      const context = canvas.getContext('2d');

      const heightMap = Array(textureSize).fill().map((_, x) => Array(textureSize).fill(0).map((value, y) => {
        const u = x/textureSize;
        const v = y/textureSize;

        const theta = 2*Math.PI*u;
        const phi = v*Math.PI;

        const radius = 1000;

        const _x = Math.cos(theta) * Math.sin(phi)*radius;
        const _y = Math.sin(theta) * Math.sin(phi) * radius;
        const _z = -Math.cos(phi) * radius;

        for(let octave=0; octave<4; octave++) {
          let period = 1024/(4**octave);
          let amplitude = 1/(4**octave);
    
          value += simplex.noise3D(_x/period,_y/period,_z/period)*amplitude;
        }
    
        return value;
      }));


      const imageData = context.createImageData(textureSize,textureSize);

      const setPixel = (x, y, color) => {
        const index = (y*imageData.width + x)*4;
    
        const r = (color & 0xff0000) >> 16;
        const g = (color & 0x00ff00) >> 8;
        const b = (color & 0x0000ff);
    
        imageData.data[index] = r;
        imageData.data[index+1] = g;
        imageData.data[index+2] = b;
        imageData.data[index+3] = 255;
      };

      heightMap.forEach((column, x) => column.forEach((value, y) => {
        const color = value < 0 ? constants.waterColor : constants.terrainColors[Math.min(Math.floor(value*constants.terrainColors.length), constants.terrainColors.length-1)];
        setPixel(x, y, color);
      }));

      context.putImageData(imageData,0,0);

      return new THREE.CanvasTexture(canvas);
    }

    const material = new THREE.MeshLambertMaterial({
      map: generateCanvasTexture(),
    });

    const sphere = new THREE.Mesh(sphereGeometry, material);

    const light = new THREE.PointLight();
    light.position.set(-100,0,80);
    this.scene.add(light);

    this.scene.add(sphere);
    this.camera.position.z = 60;

    const animate = () => {
      sphere.rotateY(0.001);
      requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    }

    animate();
  }
}

export default App;
