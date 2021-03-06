var API = require('../lib/api'),
    request = require('../lib/request'),
    options,
    api;

describe('new API', function() {
    beforeEach(function() {
        options = {
            'token': 'g74rhfjsdhf7834hj',
            'protocol': 'https:',
            'host': 'api.ludei.com',
            'port': 443,
            'path': '/v1'
        };
    });

    it('should require options argument', function() {
        expect(function() {
            options = undefined;
            api = new API(options);
        }).toThrow();
    });

    it('should require options.protocol argument', function() {
        expect(function() {
            options.protocol = undefined;
            api = new API(options);
        }).toThrow();
    });

    it('should require options.host argument', function() {
        expect(function() {
            options.host = undefined;
            api = new API(options);
        }).toThrow();
    });

    it('should require options.port argument', function() {
        expect(function() {
            options.port = undefined;
            api = new API(options);
        }).toThrow();
    });

    it('should require options.path argument', function() {
        expect(function() {
            options.path = undefined;
            api = new API(options);
        }).toThrow();
    });

    it('should require options.token argument', function() {
        expect(function() {
            options.token = undefined;
            api = new API(options);
        }).toThrow();
    });

    it('should not require options.proxy argument', function() {
        expect(function() {
            options.proxy = undefined;
            api = new API(options);
        }).not.toThrow();
    });

    it('should return api(...)', function() {
        api = new API(options);
        expect(api).toEqual(jasmine.any(Function));
    });

    describe('api(path, options, callback)', function() {
        beforeEach(function() {
            api = new API(options);
        });

        it('should require path argument', function() {
            expect(function() {
                api(null);
            }).toThrow();
        });

        it('should not require options argument', function() {
            expect(function() {
                api('/project');
            }).not.toThrow();
        });

        it('should not require callback argument', function() {
            expect(function() {
                api('/project', {});
            }).not.toThrow();
        });

        it('should try to send a request', function() {
            spyOn(request, 'send');
            api('/project', function(e, data) {});
            expect(request.send).toHaveBeenCalledWith(
                'https://api.ludei.com:443/v1/project',
                jasmine.any(Object),
                jasmine.any(Function)
            );
        });

        describe('successful request', function() {
            beforeEach(function() {
                spyOn(request, 'send').andCallFake(function(url, opts, callback) {
                    callback(null, {statusCode:200}, '{"say":"winter is coming"}');
                });
            });

            it('should be a GET request', function() {
                api('/project', function(e, data) {});
                expect(request.send.mostRecentCall.args[1].method).toEqual('GET');
            });

            it('should be a fully-qualified url', function() {
                var url = 'https://api.ludei.com:443/v1/project';
                api('/project', function(e, data) {});
                expect(request.send.mostRecentCall.args[0]).toEqual(url);
            });

            it('should be a trimmed url', function() {
                var url = 'https://api.ludei.com:443/v1/project';
                api('  ///project//  ', function(e, data) {});
                expect(request.send.mostRecentCall.args[0]).toEqual(url);
            });

            it('should trigger callback without an error', function(done) {
                api('/project', function(e, data) {
                    expect(e).toBeNull();
                    done();
                });
            });

            it('should trigger callback with data object', function(done) {
                api('/project', function(e, data) {
                    expect(data).toEqual({ say: 'winter is coming' });
                    done();
                });
            });

            describe('with form-data', function() {
                var requestSpy,
                    requestOptions,
                    formSpy;

                beforeEach(function() {
                    requestSpy = {
                        form: jasmine.createSpy()
                    };
                    formSpy = {
                        append: jasmine.createSpy()
                    };
                    requestOptions = {
                        form: {
                            file: 'my/file',
                            data: {name: 'My App'}
                        }
                    };
                    request.send.andReturn(requestSpy);
                    requestSpy.form.andReturn(formSpy);
                });

                it('should have content-type of "multipart/form-data"', function() {
                    api('/project', requestOptions, function(e, data) {});
                    expect(requestSpy.form).toHaveBeenCalled();
                });

                it('should append each key of options.form', function() {
                    api('/project', requestOptions, function(e, data) {});
                    expect(formSpy.append).toHaveBeenCalled();
                    expect(formSpy.append.mostRecentCall.args[0]).toEqual('data');
                });

                it('should handle other keys as file paths', function() {
                    var fs = require('fs');
                    spyOn(fs, 'createReadStream');

                    requestOptions.form.file = '/path/to/file';
                    api('/project', requestOptions, function(e, data) {});

                    expect(formSpy.append.callCount).toEqual(2);
                    expect(fs.createReadStream).toHaveBeenCalledWith(
                        '/path/to/file'
                    );
                });
            });

            describe('with proxy', function() {
                it('should pass proxy to request', function() {
                    options.proxy = 'http://myproxy.com';
                    api = new API(options);
                    api('/project', function(e, data) {});
                    expect(request.send.mostRecentCall.args[1].proxy).toEqual('http://myproxy.com');
                });
            });
        });

        describe('failed api request', function() {
            beforeEach(function() {
                spyOn(request, 'send').andCallFake(function(url, opts, callback) {
                    callback(new Error('timeout'), null, null);
                });
            });

            it('should trigger callback with an error', function(done) {
                api('/project', function(e, data) {
                    expect(e).toEqual(jasmine.any(Error));
                    done();
                });
            });

            it('should trigger callback without data object', function(done) {
                api('/project', function(e, data) {
                    expect(data).not.toBeDefined();
                    done();
                });
            });
        });

        describe('failed api response', function() {
            beforeEach(function() {
                spyOn(request, 'send').andCallFake(function(url, opts, callback) {
                    callback(null, { statusCode: 404 }, 'page not found');
                });
            });

            it('should trigger callback with an error', function(done) {
                api('/project', function(e, data) {
                    expect(e).toEqual(jasmine.any(Error));
                    expect(e.message).toEqual('page not found');
                    done();
                });
            });

            it('should trigger callback without data object', function(done) {
                api('/project', function(e, data) {
                    expect(data).not.toBeDefined();
                    done();
                });
            });

            describe('when no error body provided', function() {
                beforeEach(function() {
                    request.send.andCallFake(function(uri, opts, callback) {
                        callback(null, { statusCode: 501 }, '');
                    });
                });

                it('should provide default error message', function(done) {
                    api('/project', function(e, data) {
                        expect(e).toEqual(jasmine.any(Error));
                        expect(e.message).toMatch('server error');
                        done();
                    });
                });
            });
        });

        describe('failed api data', function() {
            beforeEach(function() {
                spyOn(request, 'send').andCallFake(function(url, opts, callback) {
                    callback(null, { statusCode: 200 }, '{"error":"invalid password"}');
                });
            });

            it('should trigger callback with an error', function(done) {
                api('/project', function(e, data) {
                    expect(e).toEqual(jasmine.any(Error));
                    done();
                });
            });

            it('should trigger callback without data object', function(done) {
                api('/project', function(e, data) {
                    expect(data).not.toBeDefined();
                    done();
                });
            });
        });
    });

    describe('api.get(path, options, callback)', function() {
        beforeEach(function() {
            api = new API(options);
            spyOn(api, 'request');
        });

        it('should trigger api(path, options, callback)', function() {
            api.get('/project');
            expect(api.request).toHaveBeenCalledWith(
                '/project',
                { method: 'GET' },
                jasmine.any(Function)
            );
        });

        it('should be a GET request', function() {
            api.get('/project', function(e, data) {});
            expect(api.request.mostRecentCall.args[1].method).toEqual('GET');
        });
    });

    describe('api.post(path, options, callback)', function() {
        beforeEach(function() {
            api = new API(options);
            spyOn(api, 'request');
        });

        it('should trigger api(path, options, callback)', function() {
            api.post('/project');
            expect(api.request).toHaveBeenCalledWith(
                '/project',
                { method: 'POST' },
                jasmine.any(Function)
            );
        });

        it('should be a POST request', function() {
            api.post('/project', function(e, data) {});
            expect(api.request.mostRecentCall.args[1].method).toEqual('POST');
        });
    });

    describe('api.put(path, options, callback)', function() {
        beforeEach(function() {
            api = new API(options);
            spyOn(api, 'request');
        });

        it('should trigger api(path, options, callback)', function() {
            api.put('/project', function(e, data) {});
            expect(api.request).toHaveBeenCalledWith(
                '/project',
                { method: 'PUT' },
                jasmine.any(Function)
            );
        });

        it('should be a PUT request', function() {
            api.put('/project', function(e, data) {});
            expect(api.request.mostRecentCall.args[1].method).toEqual('PUT');
        });
    });

    describe('api.del(path, options, callback)', function() {
        beforeEach(function() {
            api = new API(options);
            spyOn(api, 'request');
        });

        it('should trigger api(path, options, callback)', function() {
            api.del('/project', function(e, data) {});
            expect(api.request).toHaveBeenCalledWith(
                '/project',
                { method: 'DELETE' },
                jasmine.any(Function)
            );
        });

        it('should be a DELETE request', function() {
            api.del('/project', function(e, data) {});
            expect(api.request.mostRecentCall.args[1].method).toEqual('DELETE');
        });
    });

    describe('api(...).pipe', function() {
        it('should be available', function() {
            var spy = jasmine.createSpy();
            expect(api('/project', function(e, data) {}).pipe).toEqual(jasmine.any(Function));
        });
    });

    describe('api.defaults()', function() {
        it('should be request.defaults', function() {
            spyOn(request, 'defaults');
            api.defaults();
            expect(request.defaults).toHaveBeenCalled();
        });
    });
});
