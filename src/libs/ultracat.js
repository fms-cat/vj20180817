// お前、ナンデモアリかよ！

const UltraCat = {};

UltraCat.triangleStripQuad = [ -1, -1, 1, -1, -1, 1, 1, 1 ];
UltraCat.triangleStripQuad3 = [ -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0 ];
UltraCat.triangleStripQuadNor = [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ];
UltraCat.triangleStripQuadUV = [ 0, 0, 1, 0, 0, 1, 1, 1 ];

// destructive
UltraCat.shuffleArrayD = ( array, dice ) => {
  const f = dice ? dice : () => Math.random();
  for ( let i = 0; i < array.length - 1; i ++ ) {
    const ir = i + Math.floor( f() * ( array.length - i ) );
    const temp = array[ ir ];
    array[ ir ] = array[ i ];
    array[ i ] = temp;
  }
  return array;
};

UltraCat.triIndexToLineIndex = ( array ) => {
  let ret = [];
  for ( let i = 0; i < array.length / 3; i ++ ) {
    const head = i * 3;
    ret.push(
      array[ head     ], array[ head + 1 ],
      array[ head + 1 ], array[ head + 2 ],
      array[ head + 2 ], array[ head     ]
    );
  }
  return ret;
};

UltraCat.matrix2d = ( w, h ) => {
  let arr = [];
  for ( let iy = 0; iy < h; iy ++ ) {
    for ( let ix = 0; ix < w; ix ++ ) {
      arr.push( ix, iy );
    }
  }
  return arr;
};

UltraCat.lerp = ( a, b, x ) => a + ( b - a ) * x;
UltraCat.clamp = ( x, l, h ) => Math.min( Math.max( x, l ), h );
UltraCat.saturate = ( x ) => Math.min( Math.max( x, 0.0 ), 1.0 );
UltraCat.linearstep = ( a, b, x ) => UltraCat.saturate( ( x - a ) / ( b - a ) );
UltraCat.smoothstep = ( a, b, x ) => {
  const t = UltraCat.linearstep( a, b, x );
  return t * t * ( 3.0 - 2.0 * t );
};

UltraCat.ExpSmooth = class {
  constructor( factor ) {
    this.factor = factor;
    this.value = 0.0;
  }

  update( value, dt ) {
    this.value = UltraCat.lerp( value, this.value, Math.exp( -this.factor * dt ) );
    return this.value;
  }
};

export default UltraCat;