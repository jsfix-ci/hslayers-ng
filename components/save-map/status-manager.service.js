export default [
  '$http',
  'config',
  function ($http, config) {
    const me = this;
    angular.extend(me, {
      endpointUrl() {
        let hostName = location.protocol + '//' + location.host;
        if (angular.isDefined(config.hostname)) {
          if (
            config.hostname.status_manager &&
            config.hostname.status_manager.url
          ) {
            return config.hostname.status_manager.url;
          }
          if (config.hostname.user && config.hostname.user.url) {
            hostName = config.hostname.user.url;
          } else if (config.hostname.default && config.hostname.default.url) {
            hostName = config.hostname.default.url;
          }
        }
        if (
          config.status_manager_url &&
          config.status_manager_url.indexOf('://') > -1
        ) {
          //Full url specified
          return config.status_manager_url;
        } else {
          return (
            hostName +
            (config.status_manager_url || '/wwwlibs/statusmanager2/index.php')
          );
        }
      },
      save(compositionJson, endpoint, compoData) {
        return new Promise((resolve, reject) => {
          $http({
            url: me.endpointUrl(),
            method: 'POST',
            data: angular.toJson({
              data: compositionJson,
              permanent: true,
              id: compoData.id,
              project: config.project_name,
              thumbnail: compoData.thumbnail,
              request: 'save',
            }),
          }).then(
            (response) => {
              resolve(response);
            },
            (err) => {
              reject();
            }
          );
        });
      },
    });
    return me;
  },
];
