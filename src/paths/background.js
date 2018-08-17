// == load modules =============================================================
import UltraCat from '../libs/ultracat';
import MathCat from '../libs/mathcat';

// == export begin =============================================================
export default ( context ) => {
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const width = context.width;
  const height = context.height;

  const midiChain = context.midiChain;
  const midi = midiChain.midi;

  // == Toby Fox - Dummy! ======================================================
  const textureDummy = glCat.createTexture();
  glCat.setTextureFromArray( textureDummy, 1, 1, new Uint8Array( [ 0, 0, 0, 0 ] ) );

  // == prepare gl stuff =======================================================
  const vboPos = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad3 ) );
  const vboNor = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuadNor ) );
  const vboUv = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuadUV ) );

  // == pass definition ========================================================
  glCatPath.add( {
    background: {
      vert: require( '../shaders/object.vert' ),
      frag: require( '../shaders/background.frag' ),
      blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
      func: ( path, params ) => {
        glCat.attribute( 'pos', vboPos, 3 );
        glCat.attribute( 'nor', vboNor, 3 );
        glCat.attribute( 'uv', vboUv, 2 );

        let matM = MathCat.mat4Identity();
        matM = MathCat.mat4Apply( MathCat.mat4ScaleXYZ( 10.0 ), matM );
        matM = MathCat.mat4Apply( MathCat.mat4Translate( [ 0.0, 0.0, -3.0 ] ), matM );
        glCat.uniformMatrix4fv( 'matM', matM );

        glCat.uniform1f( 'colorOffset', midi( 'trail-colorOffset' ) );
        glCat.uniform1f( 'audioReactive', midi( 'background-audioReactive' ) );
        glCat.uniform1f( 'chroma', midi( 'background-chroma' ) );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 2 );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    }
  } );
};