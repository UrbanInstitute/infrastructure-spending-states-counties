.PHONY: clean default geo all

default:
	@echo "Please specify a target to make."
	@echo "Targets: all, clean, data, geo"

all: geo

geo: static/data/cb_2023_us_state_500k.json src/data/cb_2023_us_county_500k.json static/data/cb_2021_us_cbsa_500k.json

clean:
	rm static/data/cb_2023_us_state_500k.json
	rm static/data/cb_2021_us_cbsa_500k.json
	rm src/data/cb_2023_us_county_500k.json

static/data/cb_2021_us_cbsa_500k.json:
	mkdir -p $(dir $@)
	mkdir -p data/output

	# download zipped shapefile
	curl -o data/output/cb_2021_us_cbsa_500k.zip -L https://www2.census.gov/geo/tiger/GENZ2021/shp/cb_2021_us_cbsa_500k.zip

	# unzip download
	unzip -o data/output/cb_2021_us_cbsa_500k.zip -d data/output/cb_2021_us_cbsa_500k

	# convert shapefile to topojson
	npx mapshaper data/output/cb_2021_us_cbsa_500k/cb_2021_us_cbsa_500k.shp \ -rename-layers cbsas \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@

	touch $@

	# cleanup extra files
	rm data/output/cb_2021_us_cbsa_500k.zip
	rm -rf data/output/cb_2021_us_cbsa_500k

src/data/cb_2023_us_county_500k.json:
	mkdir -p $(dir $@)
	mkdir -p data/output

	# download zipped shapefile
	curl -o data/output/cb_2023_us_county_500k.zip -L https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip

	# unzip download
	unzip -o data/output/cb_2023_us_county_500k.zip -d data/output/cb_2023_us_county_500k

	# convert shapefile to topojson
	npx mapshaper data/output/cb_2023_us_county_500k/cb_2023_us_county_500k.shp \
		-rename-layers counties \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID, state_fips: STATEFP}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@

	touch $@

	# cleanup extra files
	rm data/output/cb_2023_us_county_500k.zip
	rm -rf data/output/cb_2023_us_county_500k

static/data/cb_2023_us_state_500k.json:
	mkdir -p $(dir $@)
	mkdir -p data/output

	# download zipped shapefile
	curl -o data/output/cb_2023_us_state_500k.zip -L https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip

	# unzip download
	unzip -o data/output/cb_2023_us_state_500k.zip -d data/output/cb_2023_us_state_500k

	# convert shapefile to topojson
	npx mapshaper data/output/cb_2023_us_state_500k/cb_2023_us_state_500k.shp \
		-rename-layers states \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@

	touch $@

	# cleanup extra files
	rm data/output/cb_2023_us_state_500k.zip
	rm -rf data/output/cb_2023_us_state_500k

