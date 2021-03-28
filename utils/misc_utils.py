from ruamel.yaml import YAML
from mako.template import Template
from .global_utils import *
import os, json, time


class Timestamp:
	def __init__(self):
		self.start= time.time()

	def __call__(self):
		return self.time()

	def time(self, brackets=False):
		ret= f"{time.time()-self.start:.1f}s"
		if brackets:
			ret= f"[{ret}]"
		return ret

	def log(self, msg, escape=True):
		if escape:
			msg= msg.replace("\n", "\\n")
		print(f"\r{self.time(True)} {msg}", end="")


yaml= YAML()
yaml.preserve_quotes= True

def contains_all(to_search, to_find, case_insensitive=True):
	def cln(x):
		if case_insensitive:
			x= x.lower()
		return x

	if isinstance(to_search, str):
		to_search= [to_search]
	srch= [cln(x) for x in to_search]

	if isinstance(to_find, str):
		to_find= [to_find]
	find= [cln(x) for x in to_find]

	is_in= lambda x: any(x in y for y in srch)

	return all(is_in(x) for x in find)

def make_dirs(path):
	if not os.path.exists(os.path.dirname(path)):
		os.makedirs(os.path.dirname(path))

def load_yaml_with_default(path, default=None):
	if default is None: default= {}

	# load json, using default if necessary
	if os.path.exists(path):
		ret= yaml.load(open(path, encoding='utf-8'))
		if ret is not None:
			return ret

	if default is not False:
		dump_yaml(default, path)
		return default
	else:
		raise Exception(f"No default supplied and file does not exist: {path}")

# use safe to get a python dictionary rather than weird dictionary wrapper
def load_yaml_from_string(x, safe=True):
	if safe:
		tmp= YAML(typ='safe')
		return tmp.load(x)
	return yaml.load(x)

def load_yaml(path):
	return load_yaml_with_default(path, default=False)

def dump_yaml(data, path):
	make_dirs(path)
	return YAML().dump(data, open(path, "w", encoding='utf-8'))


def load_json_with_default(path, default=None):
	if default is None: default= {}

	# make parent dirs if not exists
	if not os.path.exists(os.path.dirname(path)):
		os.makedirs(os.path.dirname(path))

	# load json, using default if necessary
	if os.path.exists(path):
		return json.load(open(path, encoding='utf-8'))
	elif default is not False:
		json.dump(default, open(path, "w"), indent=2)
		return default
	else:
		raise Exception(f"No default supplied and file does not exist: {path}")


def dump_json(data, path):
	make_dirs(path)
	json.dump(data, open(path,"w",encoding='utf-8'), ensure_ascii=False, indent=2)


# @todo: rewrite this
def render(template, dct, **kwargs):
	dct= { x.upper():y for x,y in dct.items() }
	dct.update({ x.upper():y for x,y in kwargs.items() })

	try:
		return Template(template).render(**dct)
	except:
		from mako import exceptions
		print(exceptions.text_error_template().render())
		raise Exception