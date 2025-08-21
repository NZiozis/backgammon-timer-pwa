SRC_DIR = src
DST_DIR = docs
DEPLOY_BRANCH = deploy

all: run

run:
	python3 -m http.server -d $(SRC_DIR) 8000


dist:
	@mkdir -p $(DST_DIR)
	@echo "Created docs/ directory"

build:
	cp -r $(SRC_DIR)/* $(DST_DIR)
	rm $(DST_DIR)/js/*
	./node_modules/.bin/esbuild $(SRC_DIR)/js/main.js $(SRC_DIR)/js/after.js --minify --outdir=$(DST_DIR)/js

deploy:
	git push origin HEAD:$(DEPLOY_BRANCH)
