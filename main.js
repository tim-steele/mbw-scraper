'use strict';

var bunyan  = require( 'bunyan' ),
    cheerio = require( 'cheerio' ),
    csv     = require( 'fast-csv' ),
    fs      = require( 'fs' ),
    request = require( 'request-promise' );

const LOG = bunyan.createLogger({
    name: "MBW Scraper",
    streams: [
        {
            path:  './mbw.log',
            level: 'debug'
        }
    ]
});

(function init ( file ) {

    let imports = fs.createReadStream( file );

    csv
        .fromPath( file, { headers: true } )
        .transform( function( mailbox ) {

            request( mailbox.URL )
                .then( function ( html ) {

                    let $ = cheerio.load( html );

                    return ( mailbox[ 'description' ] = $( '#textside' ).html() );

                })
                .catch( function ( error ) {

                    LOG.error( { err: error, product: mailbox }, 'Could not scrape mailbox' );

                });
        })
        .pipe( csv.createWriteStream( { headers: [ 'URL', 'sku',	'attribute_set_code', 'product_type', 'description' ] } ) )
        .pipe( fs.createWriteStream( './data/descriptions.csv', { encoding: 'utf8' } ) );


})( './data/import.csv' );
