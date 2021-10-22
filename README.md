## Epinio for Visual Studio Code

`Note: This extension is an experimental, work-in-progress version. The extension only works with epinio version v0.1.3 or higher`

The Epinio extension makes it easy to deploy applications from Visual Studio Code. 
epinio is an opinionated platform that runs on Kubernetes, that takes you from App to URL in one step.
For more information, Please visit https://epinio.io/

## Installation

After installing this extension, Please follow below steps.

Step 1: Spin up a kubernetes cluster. You can use `Rancher Desktop` (https://rancherdesktop.io/) to quickly spin up one. 
Step 2: Download `epinio` from https://github.com/epinio/epinio/releases for your respective operating system. 
        Rename the file to `epinio` and copy the renamed binary to a folder on your system path. 
Step 3: From a terminal, run `epinio install`. Run `epinio info`, `epinio config show` to ensure epinio is installed successfully.

## How to use this extension

- Push an application from source using the `+` button in the `apps` tree view toolbar. 
- Right click on an application in the treeview to `Push`, `Open`, set `Env`, view `logs`, `Delete` etc.
