﻿/**
  * iOS specific http client implementation.
  */
import promises = require("promises/promises");
import http = require("net/http_request");

export function request(options: http.HttpRequestOptions): promises.Promise<http.HttpResponse> {
    var d = promises.defer<http.HttpResponse>();

    try {
        var sessionConfig = Foundation.NSURLSessionConfiguration.defaultSessionConfiguration();
        var queue = Foundation.NSOperationQueue.mainQueue();
        var session = Foundation.NSURLSession.sessionWithConfigurationDelegateDelegateQueue(
            sessionConfig, null, queue);

        var urlRequest = Foundation.NSMutableURLRequest.requestWithURL(
            Foundation.NSURL.URLWithString(options.url));

        if (options.method) {
            urlRequest.setHTTPMethod(options.method);
        }

        if (options.headers) {
            for (var header in options.headers) {
                urlRequest.setValueForHTTPHeaderField(options.headers[header], header);
            }
        }

        if (typeof options.content == "string") {
            urlRequest.setHTTPBody(Foundation.NSString.initWithString(options.content).dataUsingEncoding(4));
        }

        var dataTask = session.dataTaskWithRequestCompletionHandler(urlRequest,
            function (data, response, error) {
                if (error) {
                    d.reject(new Error(error.localizedDescription()));
                } else {

                    var headers = {};
                    var headerFields = response.allHeaderFields();
                    var keys = headerFields.allKeys();

                    for (var i = 0, l = keys.count(); i < l; i++) {
                        var key = keys.objectAtIndex(i);
                        headers[key] = headerFields.valueForKey(key);
                    }

                    d.resolve({
                        content: {
                            toString: () => { return NSDataToString(data); },
                            toJSON: () => { return JSON.parse(NSDataToString(data)); },
                            toImage: () => { return require("Image/image").Image.imageFromData(data); }
                        },
                        statusCode: response.statusCode(),
                        headers: headers
                    });
                }
            });

        dataTask.resume();
    } catch (ex) {
        d.reject(ex);
    }
    return d.promise();
}

function NSDataToString(data: any): string {
    return Foundation.NSString.initWithDataEncoding(data, 4).toString();
}