![LangStream](.\images\logo.png)

# LangStream AI extension for VSCode

The [LangStream project](https://langstream.ai) combines the intelligence of large language models (LLMs) with the agility of streaming processing, to create powerful processing applications. An application in LangStream can watch a message topic and process data through multiple steps to output some useful generative AI results. Learn more about the LangStream project [here](https://langstream.ai/). Or get started with the LangStream documentation [here](https://docs.langstream.ai/).

This extension provides ways to interact with the LangStream API from within VSCode. It provides a simple way to create, update, and delete LangStream applications, modules, and pipeline agents. It also provides a way to view the status of your applications and message with its gateway.

For more about LangStream visit the [project website](https://langstream.ai/).

## Features

- Environment
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
    - Watch and search logs
    - Message with gateways
- Gateway
    - List gateways
- Pipeline
    - Code lens offers a "deploy" and "update" button to deploy or update a pipeline
- Agent
    - Snippet completion while building a pipeline

## Starting a LangStream environment

With kubectl and helm installed, you can start a LangStream control plane with the following commands.

```bash
kubectl apply -f https://raw.githubusercontent.com/LangStream/langstream/main/helm/examples/minio-dev.yaml
helm repo add langstream https://datastax.github.io/langstream
helm repo update
helm upgrade \
    -i langstream \
    -n langstream \
    --create-namespace \
    --wait \
    --values https://raw.githubusercontent.com/LangStream/langstream/main/helm/examples/simple.yaml \
    langstream/langstream
```

Forward the control plane and gateway ports

```bash
# Control plane
kubectl port-forward -n langstream svc/langstream-control-plane 8090:8090
```

```bash
# Api gateway
kubectl port-forward -n langstream svc/langstream-api-gateway 8091:8091
```

## Saving the environment in the extension

Once the extension is installed, the activity bar will have a new LangStream icon. Click it to activate the extension. You will see a link to "Add a control plane". Click that link to show the wizard. It will ask for:

- Control plane address (default http://localhost:8090)
- API Gateway address (default http://localhost:8091)
- Name the gateway

With the environment saved all its objects will be discovered and listed.