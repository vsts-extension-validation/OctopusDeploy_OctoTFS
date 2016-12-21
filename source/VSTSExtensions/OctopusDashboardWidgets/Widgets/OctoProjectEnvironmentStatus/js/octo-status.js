function OctopusStatusWidget() {
    this.Configure = function (WidgetHelpers, VSS_Auth_Service) {
        WidgetHelpers.IncludeWidgetStyles();
        VSS.register("OctoProjectEnvironmentWidget", function () {
            var $octoWidget = $('#octo-widget');
            var $versionDiv = $('#octo-info-version');
            var $projectH2 = $('#octo-info-project');
            var $environmentH2 = $('#octo-info-environment');

            var getOctopusStatus = function (widgetSettings) {
                var settings = JSON.parse(widgetSettings.customSettings.data);

                VSS.getAccessToken().then(function (token) {
                    var webContext = VSS.getWebContext();
                    var baseUri = webContext.collection.uri + 'defaultcollection/' + webContext.project.name;
                    var endpointUri = baseUri + '/_apis/distributedtask/serviceendpoints?type=OctopusEndpoint&api-version=3.0-preview.1';

                    var authToken = VSS_Auth_Service.authTokenManager.getAuthorizationHeader(token);

                    /* THIS ISN'T WORKING - WAITING ON MS TO HELP :) */
                    var queryUri = baseUri + '/_apis/distributedtask/serviceendpointproxy?endpointId=' + settings.connectionId + '&api-version=3.0-preview.1';
                    var deploymentQueryContent = '{"dataSourceDetails": {"dataSourceName":"OctopusProjectEnvironmentDeployments", "parameters":{"ProjectId": "' + settings.projectId + '", "EnvironmentId": "' + settings.environmentId + '"}}}';
                    $.ajax({
                        type: "POST",
                        url: queryUri,
                        data: deploymentQueryContent,
                        contentType: 'application/json',
                        dataType: 'json',
                        headers: { 'Authorization': authToken }
                    })
                        .done(function (data) {
                            var lastDeployment = JSON.parse(data.result[0]);    // todo: safely get last
                            // todo: this needs to be a data source in the manifestß
                            var taskQueryContent = '{"dataSourceDetails": {"dataSourceUrl":"{{endpoint.url}}' + lastDeployment.Links.Task + '}}';
                            $.ajax({
                                type: "POST",
                                url: queryUri,
                                data: taskQueryContent,
                                contentType: 'application/json',
                                dataType: 'json',
                                headers: { 'Authorization': authToken }
                            })
                                .done(function (data) {
                                    debugger;
                                    $projectH2.text(widgetSettings.projectName);
                                    $environmentH2.text(widgetSettings.environmentName);
                                    $versionDiv.text(data.Description + data.Status);
                                });
                        });
                    /*
                    var state = prompt("State (success | failure)?");
                    $projectH2.text("Deploy to Azure (#2)");
                    $environmentH2.text("Test");
                    $versionDiv.text("0.0.1");
                    if (state == 'success') {
                        $octoWidget.addClass('success').removeClass('failure');
                    } else {
                        $octoWidget.addClass('failure').removeClass('success');
                    }
                    */
                });
                return WidgetHelpers.WidgetStatusHelper.Success();
            }

            return {
                load: function (widgetSettings) {
                    return getOctopusStatus(widgetSettings);
                },
                reload: function (widgetSettings) {
                    return getOctopusStatus(widgetSettings);
                }
            }
        });

        VSS.notifyLoadSucceeded();
    }
};