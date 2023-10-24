.PHONY: clean default data geo all

default:
	@echo "Please specify a target to make."
	@echo "Targets: all, clean, data, geo"

all: geo data

geo: static/data/cb_2020_us_state_500k.json src/data/cb_2020_us_county_500k.json static/data/state_info.json

clean:
	rm -rf data/output
	rm -rf static/data
	rm src/data/cb_2020_us_county_500k.json

data:
	mkdir -p src/data
	Rscript data/scripts/format_data.R

static/data/state_info.json: data/output/cb_2020_us_state_500k/cb_2020_us_state_500k.shp
	mkdir -p $(dir $@)
	npx mapshaper $^ \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-each 'this.properties = {fips: GEOID, state_usps: STUSPS, state_name: NAME}' \
		-o format=json $@
	touch $@

src/data/cb_2020_us_county_500k.json: data/output/cb_2020_us_county_500k/cb_2020_us_county_500k.shp 
	mkdir -p $(dir $@)
	npx mapshaper $^ \
		-rename-layers counties \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID, state_fips: STATEFP}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@
	touch $@

data/output/cb_2020_us_county_500k/cb_2020_us_county_500k.shp: data/output/cb_2020_us_county_500k.zip
	mkdir -p $(dir $@)
	unzip -o $^ -d $(dir $@)
	touch $@

data/output/cb_2020_us_county_500k.zip:
	mkdir -p $(dir $@)
	curl -o $@ -L https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_county_500k.zip
	touch $@

static/data/cb_2020_us_state_500k.json: data/output/cb_2020_us_state_500k/cb_2020_us_state_500k.shp 
	mkdir -p $(dir $@)
	npx mapshaper $^ \
		-rename-layers states \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@
	touch $@

data/output/cb_2020_us_state_500k/cb_2020_us_state_500k.shp: data/output/cb_2020_us_state_500k.zip
	mkdir -p $(dir $@)
	unzip -o $^ -d $(dir $@)
	touch $@

data/output/cb_2020_us_state_500k.zip:
	mkdir -p $(dir $@)
	curl -o $@ -L https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_state_500k.zip
	touch $@
