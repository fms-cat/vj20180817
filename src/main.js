import './styles/main.scss';

// == import various modules / stuff ===========================================
import ExCanvas from './libs/excanvas';
import GLCat from './libs/glcat.js';
import GLCatPath from './libs/glcat-path-gui';
import MathCat from './libs/mathcat.js';
import MidiChain from './libs/midichain.js';
import UltraCat from './libs/ultracat.js';
import AudioReactiveCat from './libs/audioreactivecat.js';
import Clock from './libs/clock-realtime.js';

import CONFIG from './config.json';

// == we are stull struggling by this ==========================================
const $ = document.querySelector.bind( document );

// == new challenger: AudioReactiveCat!! =======================================
const arCat = new AudioReactiveCat();

// == also: MidiChain!! ========================================================
const midiChain = new MidiChain();
const midi = midiChain.midi;
midiChain.attachDOM( $( '#divMidi' ) );

// == hi excanvas ==============================================================
const exCanvasFg = new ExCanvas();
exCanvasFg.openWindow();

const exCanvasBg = new ExCanvas();
exCanvasBg.openWindow();

// == hi canvas ================================================================
const canvas = $( '#canvas' );
let width = canvas.width = CONFIG.resolution[ 0 ];
let height = canvas.height = CONFIG.resolution[ 1 ];

const gl = canvas.getContext( 'webgl' );
gl.lineWidth( 1 ); // e

const glCat = new GLCat( gl );
glCat.getExtension( 'OES_texture_float', true );
glCat.getExtension( 'OES_texture_float_linear', true );
glCat.getExtension( 'EXT_frag_depth', true );
glCat.getExtension( 'ANGLE_instanced_arrays', true );

const glCatPath = new GLCatPath( glCat, {
  el: $( '#divPath' ),
  canvas: canvas,
  stretch: true,
  drawbuffers: true
} );

// oh hi
const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

// == deal with time ===========================================================
let totalFrame = 0;
let isInitialFrame = true;

let clock = new Clock();
clock.setTime( 0.0 );

// == lights, camera, action! ==================================================
let cameraPos = [ 0.0, 0.0, 0.0 ];
let cameraTar = [ 0.0, 0.0, 0.0 ];
let cameraRoll = 0.0; // protip: considering roll of cam is cool idea

let perspFov = 70.0;
let perspNear = 0.01;
let perspFar = 100.0;

let lightPos = [ 0.0, 10.0, 10.0 ]; // this is pretty random

const shadowReso = 4096; // texture size for shadow buffer

let matP = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
let matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );
let matPL = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
let matVL = MathCat.mat4LookAt( lightPos, cameraTar, [ 0.0, 1.0, 0.0 ], 0.0 );

const updateMatrices = ( camOffset ) => {
  const x = 0.5 * Math.sin( 2.0 * Math.PI * clock.time / 10.0 );
  const y = 0.5 * Math.cos( 2.0 * Math.PI * clock.time / 10.0 );
  cameraPos = [ x, y, 5.0 ];
  if ( camOffset ) { cameraPos = MathCat.vecAdd( cameraPos, camOffset ); }
  cameraTar = [ x / 8.0, y / 8.0, 0.0 ];
  cameraRoll = 0.02 * Math.sin( 2.0 * Math.PI * clock.time / 10.0 + 1.0 );

  matP = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
  matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );

  matPL = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
  matVL = MathCat.mat4LookAt( lightPos, cameraTar, [ 0.0, 1.0, 0.0 ], 0.0 );
};
updateMatrices();

// == mouse listener, why tho ==================================================
let mouseX = 0.0;
let mouseY = 0.0;

canvas.addEventListener( 'mousemove', ( event ) => {
  mouseX = event.offsetX;
  mouseY = event.offsetY;
} );

// == global uniform variables =================================================
glCatPath.setGlobalFunc( () => {
  glCat.uniform1i( 'isInitialFrame', isInitialFrame );

  glCat.uniform1f( 'time', clock.time );
  glCat.uniform1f( 'deltaTime', clock.deltaTime );
  glCat.uniform1f( 'totalFrame', totalFrame );

  glCat.uniform3fv( 'cameraPos', cameraPos );
  glCat.uniform3fv( 'cameraTar', cameraTar );
  glCat.uniform1f( 'cameraRoll', cameraRoll );

  glCat.uniform1f( 'perspFov', perspFov );
  glCat.uniform1f( 'perspNear', perspNear );
  glCat.uniform1f( 'perspFar', perspFar );

  glCat.uniform3fv( 'lightPos', lightPos );

  glCat.uniformMatrix4fv( 'matP', matP );
  glCat.uniformMatrix4fv( 'matV', matV );
  glCat.uniformMatrix4fv( 'matPL', matPL );
  glCat.uniformMatrix4fv( 'matVL', matVL );

  glCat.uniform2fv( 'mouse', [ mouseX, mouseY ] );

  glCat.uniform4fv( 'wave', [
    context.arCat.getFreqLevel( 50 ),
    context.arCat.getFreqLevel( 300 ),
    context.arCat.getFreqLevel( 1000 ),
    context.arCat.getFreqLevel( 3000 )
  ] ); // 🔥

  glCat.uniform4fv( 'bgColor', [ 0.0, 0.0, 0.0, 1.0 ] );
} );

// == glcat-path setup =========================================================
glCatPath.add( {
  return: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/return.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  inspector: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/inspector.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniform3fv( 'circleColor', [ 1.0, 1.0, 1.0 ] );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  target: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/bg.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    framebuffer: true,
    float: true,
    drawbuffers: 2,
    depthWrite: false,
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  shadow: {
    width: shadowReso,
    height: shadowReso,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/bg.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    framebuffer: true,
    float: true,
    func: () => {
      // glCat.attribute( 'p', vboQuad, 2 );
      // gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
} );

// == setup paths ==============================================================
const context = {
  glCatPath: glCatPath,
  arCat: arCat,
  clock: clock,
  width: width,
  height: height,
  midiChain: midiChain
};

require( './paths/background' ).default( context );
require( './paths/ascii' ).default( context );
require( './paths/panes' ).default( context );
require( './paths/postfx' ).default( context );
require( './paths/dof' ).default( context );
require( './paths/jpeg' ).default( context );
require( './paths/bloom' ).default( context );
require( './paths/trails' ).default( context );
require( './paths/pieces' ).default( context );
require( './paths/lofipath' ).default( context );

// == loop here ================================================================
const update = () => {
  if ( !$( '#active' ).checked ) {
    setTimeout( update, 100 );
    return;
  }

  // == update some bunch of shit ==============================================
  clock.update();
  updateMatrices();
  arCat.update( clock.deltaTime );
  midiChain.update( clock.deltaTime );

  // == let's render this ======================================================
  glCatPath.begin();

  // == compute stuff ==========================================================
  glCatPath.render( 'trailsComputeReturn' );
  glCatPath.render( 'trailsCompute' );

  glCatPath.render( 'piecesComputeReturn' );
  glCatPath.render( 'piecesCompute' );

  // == shadow =================================================================
  glCatPath.render( 'shadow' );

  glCatPath.render( 'paneCircle', {
    target: glCatPath.fb( 'shadow' ),
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );
  glCatPath.render( 'paneFront', {
    target: glCatPath.fb( 'shadow' ),
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );

  glCatPath.render( 'lofipath', {
    target: glCatPath.fb( 'shadow' ),
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );

  glCatPath.render( 'trailsRender', {
    target: glCatPath.fb( 'shadow' ),
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );

  glCatPath.render( 'piecesRender', {
    target: glCatPath.fb( 'shadow' ),
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );

  // == foreground =============================================================
  glCatPath.render( 'target' );

  glCatPath.render( 'paneCircle', {
    target: glCatPath.fb( 'target' ),
    textureShadow: glCatPath.fb( 'shadow' ).texture,
    width: width,
    height: height
  } );
  glCatPath.render( 'paneFront', {
    target: glCatPath.fb( 'target' ),
    textureShadow: glCatPath.fb( 'shadow' ).texture,
    width: width,
    height: height
  } );

  glCatPath.render( 'lofipath', {
    target: glCatPath.fb( 'target' ),
    textureShadow: glCatPath.fb( 'shadow' ).texture,
    width: width,
    height: height
  } );

  glCatPath.render( 'trailsRender', {
    target: glCatPath.fb( 'target' ),
    textureShadow: glCatPath.fb( 'shadow' ).texture,
    width: width,
    height: height
  } );

  glCatPath.render( 'piecesRender', {
    target: glCatPath.fb( 'target' ),
    textureShadow: glCatPath.fb( 'shadow' ).texture,
    width: width,
    height: height
  } );

  glCatPath.render( 'dof', {
    color: glCatPath.fb( 'target' ).textures[ 0 ],
    depth: glCatPath.fb( 'target' ).textures[ 1 ]
  } );

  let textureToJpegCosine = glCatPath.fb( 'dof' ).texture;
  if ( 0.5 < midi( 'ascii' ) ) {
    textureToJpegCosine = glCatPath.fb( 'ascii' ).texture;
    glCatPath.render( 'ascii', {
      input: glCatPath.fb( 'dof' ).texture
    } );
  }

  glCatPath.render( 'jpegCosine', {
    input: textureToJpegCosine
  } );
  glCatPath.render( 'jpegRender' );

  glCatPath.render( 'glitch', {
    input: glCatPath.fb( 'jpegRender' ).texture
  } );
  glCatPath.render( 'post', {
    input: glCatPath.fb( 'glitch' ).texture
  } );

  glCatPath.render( 'return', {
    target: GLCatPath.nullFb,
    input: glCatPath.fb( 'post' ).texture
  } );

  exCanvasFg.draw( canvas );

  // == background =============================================================
  updateMatrices( [ 0.0, 0.0, -3.0 ] );
  glCatPath.render( 'target' );

  glCatPath.render( 'background', {
    target: glCatPath.fb( 'target' ),
    textureShadow: glCatPath.fb( 'shadow' ).texture,
    width: width,
    height: height
  } );

  textureToJpegCosine = glCatPath.fb( 'target' ).textures[ 0 ];
  if ( 0.5 < midi( 'ascii' ) ) {
    textureToJpegCosine = glCatPath.fb( 'ascii' ).texture;
    glCatPath.render( 'ascii', {
      input: glCatPath.fb( 'target' ).textures[ 0 ]
    } );
  }

  glCatPath.render( 'jpegCosine', {
    input: textureToJpegCosine
  } );
  glCatPath.render( 'jpegRender' );

  glCatPath.render( 'glitch', {
    input: glCatPath.fb( 'jpegRender' ).texture
  } );
  glCatPath.render( 'post', {
    target: GLCatPath.nullFb,
    input: glCatPath.fb( 'glitch' ).texture
  } );

  exCanvasBg.draw( canvas );

  // == inspector ==============================================================
  glCatPath.render( 'return', {
    target: GLCatPath.nullFb,
    input: glCatPath.fb( 'post' ).texture
  } );

  glCatPath.end();

  // == finalize the loop ======================================================
  isInitialFrame = false;
  totalFrame ++;

  requestAnimationFrame( update );
};

update();

// == keyboard is good =========================================================
window.addEventListener( 'keydown', ( event ) => {
  if ( event.which === 27 ) { // panic button
    $( '#active' ).checked = false;
  }

  if ( event.which === 32 ) { // play / pause
    clock.isPlaying ? clock.pause() : clock.play();
  }
} );