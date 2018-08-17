const lerp = ( a, b, x ) => ( a + ( b - a ) * x );

const MidiChain = class {
  constructor() {
    this.params = {};
    this.learning = '';

    this.noteMap = {};
    this.ccMap = {};

    this.dom = null;

    navigator.requestMIDIAccess().catch( ( error ) => {
      throw new Error( error );
    } ).then( ( data ) => {
      const inputIter = data.inputs.values();
      for ( let input = inputIter.next(); !input.done; input = inputIter.next() ) {
        const value = input.value;
        value.addEventListener( 'midimessage', this.__onMidiMessage.bind( this ) );
      }
    } );

    window.addEventListener( 'wheel', ( event ) => {
      if ( this.learning && this.params[ this.learning ] ) {
        this.params[ this.learning ].raw = Math.min( Math.max( this.params[ this.learning ].raw - 0.001 * event.deltaY, 0.0 ), 1.0 );
        this.__updateDOM();
      }
    } );

    this.midi = ( ...args ) => this.__midi( ...args );
  }

  createParam( key ) {
    this.params[ key ] = {
      value: 0.0,
      raw: 0.0,
      smooth: 1E9,
      listeners: []
    };
    this.__updateDOM();
  }

  attachDOM( dom ) {
    this.dom = dom;
    this.__updateDOM();
  }

  __updateDOM() {
    if ( !this.dom ) { return; }

    for ( let key in this.params ) {
      let domParam = this.dom.querySelector( `.${ key }` );
      if ( !domParam ) {
        domParam = document.createElement( 'div' );
        domParam.className = key;

        domParam.onclick = () => {
          this.learn( key );
        };

        // dict
        let done = false;
        for ( let iDom in this.dom.childNodes ) {
          const el = this.dom.childNodes[ iDom ];
          if ( el.className && key < el.className ) {
            this.dom.insertBefore( domParam, el );
            done = true;
            break;
          }
        }
        if ( !done ) {
          this.dom.appendChild( domParam );
        }
      }
      domParam.innerText = `${ key }: ${ this.params[ key ].raw.toFixed( 3 ) }`;
      domParam.style.color = key === this.learning ? '#0f0' : '';
    }
  }

  learn( key ) {
    this.learning = key;
    this.__updateDOM();
  }

  update( deltaTime ) {
    const dt = deltaTime || 1.0 / 60.0;
    for ( let key in this.params ) {
      this.params[ key ].value = lerp(
        this.params[ key ].raw,
        this.params[ key ].value,
        Math.exp( -dt * this.params[ key ].smooth )
      );
    }
  }

  __onMidiMessage( event ) {
    let key = '';
    let value = 0;

    if ( event.data && event.data[ 0 ] === 128 || event.data[ 0 ] === 144 ) {
      if ( this.learning ) {
        this.noteMap[ event.data[ 1 ] ] = this.learning;
        this.learning = '';
      }

      key = this.noteMap[ event.data[ 1 ] ];
      value = event.data[ 0 ] === 128 ? 0.0 : event.data[ 2 ] / 127.0;

    } else if ( event.data && event.data[ 0 ] === 176 ) {
      if ( this.learning ) {
        this.ccMap[ event.data[ 1 ] ] = this.learning;
        this.learning = '';
      }

      key = this.ccMap[ event.data[ 1 ] ];
      value = event.data[ 2 ] / 127.0;
    }

    if ( key ) {
      this.params[ key ].raw = value;
      this.params[ key ].listeners.forEach(
        ( listener ) => ( listener( this.params[ key ].raw ) )
      );
    }

    this.__updateDOM();
  }

  __midi( key, options ) {
    if ( !this.params[ key ] ) {
      this.createParam( key );
    }

    if ( options && options.smooth ) {
      this.params[ key ].smooth = options.smooth;
    }

    if ( options && options.listener ) {
      this.params[ key ].listeners.push( options.listener );
    }

    return this.params[ key ].value;
  }
};

export default MidiChain;