#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

# Run from root of project
export OPENAPI_GENERATOR_VERSION=6.6.0

chmod +x ./.github/openapi/openapi-generator-cli.sh

ADDITIONAL_PROPS='sortParamsByRequiredFlag=true,sortModelPropertiesByRequiredFlag=true,supportsES6=true,enumPropertyNaming=camelCase,modelPropertyNaming=camelCase,paramNaming=camelCase,withSeparateModelsAndApi=true,apiPackage=apis,modelPackage=models,disallowAdditionalPropertiesIfNotPresent=false'

bash ./.github/openapi/openapi-generator-cli.sh generate \
  -g typescript-axios \
  -o ./src/services/controlPlaneApi/gen \
  -i http://localhost:8090/v3/api-docs/all \
  --skip-validate-spec \
  --additional-properties=${ADDITIONAL_PROPS}