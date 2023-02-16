const { json } = require('express')

/**
 * This module adds an application-wide CSP header on each response, 
 * it also provides a route to send csp violation reports to.
 * The CSP header values can be changed with the exported CSPOptions object.
 */

const logHeaders = false

/**
 * @typedef {Object} CSPHeader
 * @property {"'none'"|string[]} default-src Value of the default-src csp property
 * @property {"'none'"|string[]} script-src Value of the script-src csp property
 * @property {"'none'"|string[]} object-src Value of the object-src csp property
 * @property {"'none'"|string[]} styles-src Value of the style-src csp property
 * @property {"'none'"|string[]} img-src Value of the img-src csp property
 * @property {"'none'"|string[]} media-src Value of the media-src csp property
 * @property {"'none'"|string[]} frame-src Value of the frame-src csp property
 * @property {"'none'"|string[]} font-src Value of the font-src csp property
 * @property {"'none'"|string[]} connect-src Value of the connect-src csp property
 * @property {"'none'"|string[]} manifest-src Value of the manifest-src csp property
 * @property {"'none'"|string[]} worker-src Value of the worker-src csp property
 * @property {"'none'"|string[]} base-uri Value of the base-uri csp property
 * @property {"'none'"|string[]} form-action Value of the form-action csp property 
 * @property {?string[]} sandbox Value of the sandbox csp property
 * @property {?string} report-uri Where to send csp violation reports
 * @property {?string} report-to Endpoint to send csp violation reports to
 *//**
 * @type {{csp: CSPHeader, endpoints: Object.<string, string>}} Contains all csp header values 
 */
let options = {
    csp: {
        'default-src': "'none'",
        'script-src': ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "maxcdn.bootstrapcdn.com", "code.jquery.com", "cdnjs.cloudflare.com"],
        'object-src': "'none'",
        'style-src': ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "maxcdn.bootstrapcdn.com", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
        'img-src': ["'self'", 'data:', 'www.w3.org', 'icon2.cleanpng.com', 'p.kindpng.com', 'res.cloudinary.com', 'e7.pngegg.com', 'e1.pngegg.com', 'encrypted-tbn0.gstatic.com', 'w7.pngwing.com'],
        'media-src': ["'self'", 'data:'],
        'frame-src': ["'self'"],
        'font-src': ["'self'", "maxcdn.bootstrapcdn.com", "cdnjs.cloudflare.com", "fonts.gstatic.com"],
        'connect-src': ["'self'"],
        'manifest-src': ["'self'"],
        'worker-src': "'none'",
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'sandbox': null,
        'report-to': 'csp-endpoint',
        'report-uri': '/cspviolation'
    },
    endpoints: {
        'csp-endpoint': '/cspviolation'
    }
}


function buildCspHeader() {
    const header = options.csp
    let policies = []

    for (const k in header) {
        if (k === 'report-to')
            continue
        if (typeof header[k] === 'string')
            policies.push(`${k} ${header[k]}`)
        else if (Array.isArray(header[k]))
            policies.push(`${k} ${header[k].join(' ')}`)
    }

    return policies.join('; ')
}

function buildEndpointHeader() {
    const header = options.endpoints
    let endpoints = []

    for (const k in header)
        endpoints.push(`${k}="${header[k]}"`)

    return endpoints.join(', ')
}


/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = (app, cache, logger) => {
    cache.require('authenticate', true)?.options.whitelist.push('/cspviolation')

    // install required parsing middleware
    app.use('/cspviolation', json({ type: 'application/json' }))            // for old browsers
    app.use('/cspviolation', json({ type: 'application/reports+json' }))    // for report-to
    app.use('/cspviolation', json({ type: 'application/csp-report' }))      // for report-uri

    // add middleware that sets the csp header
    logger.info('Installing csp middleware')
    app.use((req, res, next) => {
        const endpointHeader = buildEndpointHeader()
        logger.debug(`Applying endpoint header${logHeaders ? ': ' + endpointHeader : ''}`)
        res.setHeader('Reporting-Endpoints', endpointHeader)

        const cspHeader = buildCspHeader()
        logger.debug(`Applying csp header${logHeaders ? ': ' + cspHeader : ''}`)
        res.setHeader('Content-Security-Policy', cspHeader)

        if (typeof options.csp['report-to'] === 'string')
            res.setHeader('Report-To', options.csp['report-to'])

        next()
    })

    return { options }
}
