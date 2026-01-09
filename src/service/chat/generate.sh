#!/bin/bash

protoc --plugin=$(which protoc-gen-ts_proto) --ts_proto_out=. --ts_proto_opt=outputClientImpl=grpc-web stream_list.proto