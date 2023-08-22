![](.\images\logo.png)

# LangStream AI extension for VSCode

The LangStream project combines the intelligence of large language models (LLMs) with the agility of streaming processing, to create powerful processing applications. An application in LangStream can watch a message topic and process data through multiple steps to output some useful generative AI results. Learn more about the LangStream project [here](https://langstream.ai/). Or get started with the LangStream documentation [here](https://docs.langstream.ai/).

This extension provides ways to interact with the LangStream API from within VSCode. It provides a simple way to create, update, and delete LangStream applications, modules, and pipeline agents. It also provides a way to view the status of your applications and message with its gateway.

## Features

- Control plane
    - Save and load control plane configurations
    - List control plane tenants/applications
    - API client
- Tenant
    - Create and delete tenants
    - List tenant applications
    - Initialize application manifests
- Application
    - List application components (modules/pipelines/agents)
    - Delete application
    - Get application details
    - Watch application logs
    - Message with gateways
- Gateway
    - List gateways
- Pipeline
    - Code lens shows a deploy and update button
- Agent
    - Snippet completion while building a pipeline

## Starting a LangStream control plane

With kubectl and helm installed, you can start a LangStream control plane with the following commands:

1. Install MinIO for storage

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/LangStream/langstream/main/helm/examples/minio-dev.yaml
    ```

1. Install the LangStream helm chart

    ```bash
    helm repo add langstream https://langstream.github.io/charts
    helm repo update
    ```

1. Create a control plane

    ```bash
    helm upgrade -i -n langstream --create-namespace langstream --wait langstream/langstream --values helm/examples/simple.yaml
    ```
   
1. Forward the control plane and gateway ports

    ```bash
    # Control plane
    kubectl port-forward -n langstream svc/langstream-control-plane 8090:8090
    ```

    ```bash
    # Api gateway
    kubectl port-forward -n langstream svc/langstream-api-gateway 8091:8091
    ```

## Saving a control plane in the extension

Once installed the activity bar will have a new "AI" icon. Click it to activate the extension. You will see a link to "Add a control plane". Click that link to show the wizard. It will ask for:

- Control plane address (default http://localhost:8090)
- API Gateway address (default http://localhost:8091)
- Name the gateway

With the control plane saved all its objects will be discovered and listed.