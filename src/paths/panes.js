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
    paneCircle: {
      vert: require( '../shaders/object.vert' ),
      frag: require( '../shaders/pane-circle.frag' ),
      drawbuffers: 2,
      blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
      func: ( path, params ) => {
        glCat.attribute( 'pos', vboPos, 3 );
        glCat.attribute( 'nor', vboNor, 3 );
        glCat.attribute( 'uv', vboUv, 2 );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 2 );

        for ( let i = 0; i < 5; i ++ ) {
          const z = UltraCat.lerp( -1.0, 1.0, i / 4.0 );

          let matM = MathCat.mat4Identity();
          matM = MathCat.mat4Apply( MathCat.mat4ScaleXYZ( 3.0 ), matM );
          matM = MathCat.mat4Apply( MathCat.mat4Translate( [ 0.0, 0.0, z ] ), matM );
          glCat.uniformMatrix4fv( 'matM', matM );

          glCat.uniform1f( 'type', i % 3 );
          glCat.uniform1f( 'radius',
            midi( 'panes-circleRadius', { smooth: 10.0 } ) * ( 0.7 + 0.3 * Math.sin( i + 0.1 * context.clock.time ) ) - 0.1
          );

          gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
        }
      }
    },

    paneFront: {
      vert: require( '../shaders/object.vert' ),
      frag: require( '../shaders/pane-front.frag' ),
      drawbuffers: 2,
      blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
      func: ( path, params ) => {
        glCat.attribute( 'pos', vboPos, 3 );
        glCat.attribute( 'nor', vboNor, 3 );
        glCat.attribute( 'uv', vboUv, 2 );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 2 );

        let matM = MathCat.mat4Identity();
        matM = MathCat.mat4Apply( MathCat.mat4ScaleXYZ( 3.0 * midi( 'path-scale' ) ), matM );
        matM = MathCat.mat4Apply( MathCat.mat4Translate( [ 0.0, 0.0, 2.0 ] ), matM );
        glCat.uniformMatrix4fv( 'matM', matM );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    }
  } );
};