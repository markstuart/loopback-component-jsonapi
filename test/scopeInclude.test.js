var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var ds;
var app;
var Post;
var Comment;

describe('include option', function () {
  beforeEach(function () {
    app = loopback();
    app.set('legacyExplorer', false);
    ds = loopback.createDataSource('memory');
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    }, {
      scope: {
        'include': 'comments'
      }
    });
    app.model(Post);

    Comment = ds.createModel('comment', {
      id: {type: Number, id: true},
      postId: Number,
      title: String,
      comment: String
    });
    app.model(Comment);
    Post.hasMany(Comment, {as: 'comments', foreignKey: 'postId'});
    Comment.settings.plural = 'comments';

    app.use(loopback.rest());
    JSONAPIComponent(app, {restApiRoot: '/'});
  });

  describe('include defined at model level', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'my post',
        content: 'my post content'
      }, function (err, post) {
        expect(err).to.equal(null);
        post.comments.create({
          title: 'My comment',
          comment: 'My comment text'
        }, function () {
          post.comments.create({
            title: 'My second comment',
            comment: 'My second comment text'
          }, done);
        });
      });
    });

    describe('hasMany response', function () {

      it('should have key `included`', function (done) {
        request(app).get('/posts/1')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.included).to.be.an('array');
            done();
          });
      });

      it('attributes should not have relationship key', function (done) {
        request(app).get('/posts/1')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.data.attributes).to.not.include.key('comments');
            done();
          });
      });

    });
  });

});
