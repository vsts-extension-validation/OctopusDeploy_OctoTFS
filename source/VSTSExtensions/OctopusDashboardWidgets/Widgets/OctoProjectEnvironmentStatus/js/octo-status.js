function OctopusStatusWidget() {
    this.Configure = function (WidgetHelpers, VSS_Auth_Service) {
        WidgetHelpers.IncludeWidgetStyles();
        VSS.register("OctoProjectEnvironmentWidget", function () {
            var $octoWidget = $('#octo-widget');
            var $statusIconDiv = $('#octo-info-statusIcon')
            var $statusDiv = $('#octo-info-status')
            var $descriptionDiv = $('#octo-info-description');
            var $projectH2 = $('#octo-info-project');
            var $environmentH2 = $('#octo-info-environment');

            var getOctopusStatus = function (widgetSettings) {
                var settings = JSON.parse(widgetSettings.customSettings.data);

                VSS.getAccessToken().then(function (token) {
                    var webContext = VSS.getWebContext();
                    var baseUri = webContext.collection.uri + 'defaultcollection/' + webContext.project.name;
                    var endpointUri = baseUri + '/_apis/distributedtask/serviceendpoints?type=OctopusEndpoint&api-version=3.0-preview.1';

                    var authToken = VSS_Auth_Service.authTokenManager.getAuthorizationHeader(token);

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
                            var taskQueryContent = '{"dataSourceDetails": {"dataSourceName":"OctopusTaskDetails", "parameters": {"TaskApiUri": "' + lastDeployment.Links.Task + '"}}}';
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
                                    taskHeaders = JSON.parse(widgetSettings.customSettings.data);
                                    taskDetail = JSON.parse(data.result[0]);
                                    finishedSuccessfully = taskDetail.FinishedSuccessfully;
                                    $projectH2.text(taskHeaders.projectName);
                                    $environmentH2.text(taskHeaders.environmentName);
                                    $statusDiv.text(taskDetail.State);
                                    $descriptionDiv.text(taskDetail.Completed);
                                    if (finishedSuccessfully) {
                                        $statusIconDiv.addClass('bowtie-status-success').removeClass('bowtie-status-failure');
                                    } else {
                                        $statusIconDiv.addClass('bowtie-status-failure').removeClass('bowtie-status-success');
                                    }
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