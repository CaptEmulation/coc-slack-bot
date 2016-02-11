var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      vendor: {
        files: [
          {
            expand: true, cwd: 'bower_components',
            src: '**', dest: 'public/vendor/'
          }
        ]
      }
    },
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          ignore: [
            'node_modules/**',
            'public/**'
          ],
          ext: 'js'
        }
      }
    },
    watch: {
      clientJS: {
        files: [
          'public/js/**/*.js', '!public/**/*.min.js', '!vendor'
        ],
        tasks: ['requirejs:compile']
      },
      clientLess: {
        files: [
          'public/less/**/*.less'
        ],
        tasks: ['newer:less']
      },
      clientJade: {
        files: [
          'public/*.jade'
        ],
        tasks: ['newer:jade']
      }
    },
    jshint: {
      client: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: [
            'public/js/**/*.min.js'
          ]
        },
        src: [
          'public/js/**/*.js'
        ]
      },
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'private/**/*.js'
        ]
      }
    },
    less: {
      options: {
        compress: true
      },
      layouts: {
      },
      views: {
        files: [{
          expand: true,
          cwd: 'public/less',
          src: ['**/*.less'],
          dest: 'public/css',
          ext: '.min.css'
        }]
      }
    },
    clean: {
      js: {
        src: [
          'public/js/**/*.min.js',
          'public/js/**/*.min.js.map'
        ]
      },
      css: {
        src: [
          'public/css/**/*.min.css'
        ]
      },
      vendor: {
        src: ['public/vendor/**']
      }
    },
    jade: {
      compile: {
        options: {
          pretty: true
        },
        files: {
          'public/index.html': 'public/*.jade'
        }
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: 'public/js',
          name: '../vendor/requirejs/require',
          out: 'public/main.min.js',
          optimize: 'none'
        }
      }
    },
    '--': '$(ps aux | grep "node app.js" | grep -v "grep"); kill -s USR1 $2'
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');

  grunt.registerTask('default', ['copy:vendor', 'newer:less', 'requirejs:compile', 'jade', 'concurrent']);
  grunt.registerTask('build', ['copy:vendor', 'less']);
  grunt.registerTask('lint', ['jshint']);
};
