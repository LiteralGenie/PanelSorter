from os.path import dirname, realpath

ROOT_DIR= dirname(dirname(realpath(__file__))) + "/"

DATA_DIR= ROOT_DIR + "data/"
CACHE_DIR= ROOT_DIR + "cache/"

DATASET_DIR= DATA_DIR + "datasets/"
DS_CACHE_DIR= DATASET_DIR + "cached/"
DS_ORIG_DIR= DATASET_DIR + "original/"

STATIC_DIR= DATA_DIR + "static/"


