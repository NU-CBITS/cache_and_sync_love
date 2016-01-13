'use strict';

describe('Ajax', function() {
  var url = 'https://api.example.com';

  var TestResponses = {
    create: {
      bad_request: {
        status: 400
      },
      valid_created: {
        status: 201,
        responseText: '{"data":[{"uuid":"abcd"}]}'
      },
      invalid_created: {
        status: 201,
        responseText: 'asdf'
      },
      valid_fetched: {
        status: 200,
        responseText: '{"data":[{"uuid":"abcd"}]}'
      },
      invalid_fetched: {
        status: 200,
        responseText: 'asdf'
      }
    }
  };

  beforeEach(function() {
    jasmine.Ajax.install();
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    jasmine.Ajax.uninstall();
  });

  describe('.post', function() {
    describe('when there is a network timeout', function() {
      it('rejects the promise', function(done) {
        cbit.Ajax.post(url).then(done.fail).catch(done);

        jasmine.Ajax.requests.mostRecent().responseTimeout();
      });
    });

    describe('when there is a network error', function() {
      it('rejects the promise', function(done) {
        cbit.Ajax.post(url).then(done.fail).catch(done);

        jasmine.Ajax.requests.mostRecent().responseError();
      });
    });

    describe('when there is a non-201 response status', function() {
      it('rejects the promise', function(done) {
        cbit.Ajax.post(url).then(done.fail).catch(done);

        jasmine.Ajax.requests.mostRecent()
          .respondWith(TestResponses.create.bad_request);
      });
    });

    describe('when there is a 201 response status', function() {
      describe('and the response body is valid JSON', function() {
        it('resolves the promise with the deserialized JSON', function(done) {
          cbit.Ajax.post(url).then(function(result) {
            expect(result.data).toEqual([{ uuid: 'abcd' }]);
            done();
          }).catch(done.fail);

          jasmine.Ajax.requests.mostRecent()
            .respondWith(TestResponses.create.valid_created);
        });
      });

      describe('and the response body is not valid JSON', function() {
        it('rejects the promise', function(done) {
          cbit.Ajax.post(url).then(done.fail).catch(done);

          jasmine.Ajax.requests.mostRecent()
            .respondWith(TestResponses.create.invalid_created);
        });
      });
    });
  });

  describe('.get', function() {
    describe('when there is a network timeout', function() {
      it('rejects the promise', function(done) {
        cbit.Ajax.get(url).then(done.fail).catch(done);

        jasmine.Ajax.requests.mostRecent().responseTimeout();
      });
    });

    describe('when there is a network error', function() {
      it('rejects the promise', function(done) {
        cbit.Ajax.get(url).then(done.fail).catch(done);

        jasmine.Ajax.requests.mostRecent().responseError();
      });
    });

    describe('when there is a non-201 response status', function() {
      it('rejects the promise', function(done) {
        cbit.Ajax.get(url).then(done.fail).catch(done);

        jasmine.Ajax.requests.mostRecent()
          .respondWith(TestResponses.create.bad_request);
      });
    });

    describe('when there is a 200 response status', function() {
      describe('and the response body is valid JSON', function() {
        it('resolves the promise with the deserialized JSON', function(done) {
          cbit.Ajax.get(url).then(function(result) {
            expect(result.data).toEqual([{ uuid: 'abcd' }]);
            done();
          }).catch(done.fail);

          jasmine.Ajax.requests.mostRecent()
            .respondWith(TestResponses.create.valid_fetched);
        });
      });

      describe('and the response body is not valid JSON', function() {
        it('rejects the promise', function(done) {
          cbit.Ajax.get(url).then(done.fail).catch(done);

          jasmine.Ajax.requests.mostRecent()
            .respondWith(TestResponses.create.invalid_fetched);
        });
      });
    });
  });
});
