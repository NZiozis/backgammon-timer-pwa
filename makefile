SRC_DIR = src
DST_DIR = docs
DEPLOY_BRANCH = deploy

all: build

build: dist copy_files

dist:
	@mkdir -p $(DST_DIR)
	@echo "Created docs/ directory"

copy_files:
	cp -r $(SRC_DIR)/* $(DST_DIR)
	rm $(DST_DIR)/js/*
	./node_modules/.bin/esbuild $(SRC_DIR)/js/main.js $(SRC_DIR)/js/after.js --minify --outdir=$(DST_DIR)/js

deploy: build
	git push origin HEAD:$(DEPLOY_BRANCH)

