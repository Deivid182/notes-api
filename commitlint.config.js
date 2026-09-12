// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // nueva funcionalidad
        'fix', // bug fix
        'docs', // solo documentación
        'style', // formato, no afecta código
        'refactor', // cambio que no añade feature ni fix
        'perf', // mejora de rendimiento
        'test', // añadir/corregir tests
        'build', // sistema de build o deps
        'ci', // CI
        'chore', // otras tareas (no toca src ni test)
        'revert', // revertir commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'users',
        'notes',
        'shared',
        'config',
        'http',
        'graphql',
        'sqlite',
        'postgres',
        'mongodb',
        'docker',
        'ci',
        'infra',
        'deps',
        'docs',
        'release',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 120],
  },
};
