const sinon = require('sinon');
const request = require('request-promise');

function makeFakeAsyncRequest(method, resolvedObject) {
  return sinon.stub(request, method).resolves(resolvedObject);
}

module.exports = {
  makeAsyncRequestWithSuccess: resolvedObj => makeFakeAsyncRequest('get', Promise.resolve(resolvedObj)),
  makeAsyncRequestWithFail: resolvedObj => makeFakeAsyncRequest('get', Promise.reject(resolvedObj)),
}
