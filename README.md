## Epinio for Visual Studio Code

`Note: This extension is an experimental, work-in-progress version`

The Epinio extension makes it easy to deploy applications from Visual Studio Code. 
epinio is an opinionated platform that runs on Kubernetes, that takes you from App to URL in one step.
For more information, Please visit https://epinio.io/

## Installation

This extenstion assumes that epinio is installed on a running kubernetes cluster on your machine. 
Please visit https://github.com/epinio/epinio for epinio installation instructions.
You can also use `Rancher Desktop` (https://rancherdesktop.io/) to quickly spin up a kubernetes cluster.

## How to use this extension

- Switch to the `Epinio` menu in the left hand side activity bar to view the applications already pushed via CLI.
- Or Push an application from source using the `+` button in the `apps` tree view toolbar.
- Right click on your application name to `Push`, `Open`, set `Env`, view `logs`, `Delete` etc.
