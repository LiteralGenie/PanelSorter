"""
Script to help label training data.

----

**Warning**
Run this from CMD or check "emulate terminal in output console" (PyCharm).
The first few subprocesses won't start immediately after `start()` unless this is done.
Probably because multiprocessing doesn't play nice with "interactive interpreters": https://docs.python.org/3/library/multiprocessing.html

toy demo of this:

import multiprocessing, time

def echo(x):
	print('echoing', x)

if __name__ == "__main__":
	inp= None
	while inp != "break":
		# get text
		inp=  input("...? ")
		# time.sleep(.1) # prints won't show immediately unless you uncomment this for whatever reason

		# print text from new process
		proc= multiprocessing.Process(target=echo, args=(inp,), daemon=True)
		proc.start()
"""

import glob, cv2, utils, numpy as np, os, random
import multiprocessing

import base64, requests, webbrowser, time, ctypes
from classes.dynamic_page import DynamicPage


series= "knight_run"
SEEN_DATA= utils.load_json_with_default("./verified.json")
ts= utils.Timestamp()
session= requests.session()
# leave none if image that contours were created from is unavailable
get_src= None
def get_src(data):
	tmp= data['other']['source']
	return rf"C:\Programming\KR_Textify\data\chaps\{tmp['chap_num']}/naver/{tmp['page_num']}.png"

def iter_data():
	data_dir= utils.DS_ORIG_DIR + series + "/"
	lst= glob.glob(data_dir + "*")

	for fp in lst:
		data= utils.load_json_with_default(fp, default=False)
		ret= dict(
			data=data,
			file_path=fp
		)

		if get_src:
			ret['orig_path']= get_src(data)

		yield ret

def draw_item(item):
	data= item['data']
	canvas= np.zeros(data['dimensions'][:2] + [3], dtype=np.uint8)

	# concatenate original if available
	if item.get('orig_path', None):
		original= cv2.imread(item['orig_path'])
		canvas= np.concatenate([canvas, original], axis=1)

	# convert contours back to the original format
	# (opencv expects a redundant dimension for some reason)
	contours= { ind: np.array([[y] for y in x]) for ind,x in data['contours'].items() }

	# loop contours
	for ind,x in contours.items():
		# inits
		index= data['order'].index(ind)

		# get random color
		color= (random.randint(50,255), random.randint(50,255), random.randint(50,255))

		# draw
		cv2.drawContours(canvas, [x], -1, color=color, thickness=2)

		# label
		moments= cv2.moments(x)
		if 0 == moments['m00'] == moments['m01'] == moments['m10']:
			center= (0,0)
		else:
			center= (
				int(moments['m10'] / moments['m00']),
				int(moments['m01'] / moments['m00']),
			)
		cv2.putText(canvas, f'Panel {index}', center,
					cv2.FONT_HERSHEY_SIMPLEX, fontScale=1, color=color, thickness=2)

	return canvas

class PreloadedList:
	def __init__(self, load_func, load_args, to_load=None):
		if to_load is None:
			to_load= []

		self.load_func= load_func
		self.load_args= load_args

		self._load_proc= None

		global manager
		self.mgr= manager
		self.loaded= self.mgr.dict()
		self.to_load= self.mgr.list(to_load)

	@staticmethod
	def _load(ind_lst, data_dct, load_func, load_args):
		while True:
			for x in ind_lst:
				if x not in data_dct:
					data_dct[x]= load_func(*load_args, x)
			time.sleep(2)

	def remove(self, ind, decrement=False):
		if ind in self.to_load:
			tmp= self.to_load.index(ind)
			del self.to_load[tmp]
			del self.loaded[ind]

			if decrement:
				for x,y in list(self.loaded.items()):
					if x > ind:
						self.loaded[x-1]= y
						del self.loaded[x]

						tmp= self.to_load.index(x)
						del self.to_load[tmp]
						self.to_load.append(x-1)

	def add(self, ind):
		self.to_load.append(ind)

	def center(self, ind, max_ind, load_lim=5):
		# inits
		new_inds= [ i%max_ind for i in range(ind-load_lim, ind+load_lim+1) ]
		old_inds= list(self.to_load)

		# remove indices that arent in new list
		for x in old_inds:
			if x not in new_inds:
				self.remove(x)

		# add new indices
		for x in new_inds:
			if x not in self.to_load:
				self.add(x)

		# return
		return self.to_load

	def start(self):
		self._load_proc= multiprocessing.Process(target=self._load, daemon=True,
												 args=(self.to_load, self.loaded, self.load_func, self.load_args))
		self._load_proc.start()


def image_to_base64(image):
	_, string= cv2.imencode('.png', image)
	string= string.tobytes()
	string= base64.b64encode(string)
	string= str(string)[2:-1]
	return string

# show image in browser
def update_image(string):
	global current_image
	# requests.post(r'http://localhost:5000/update/', data=dict(image=string))
	current_image.value= string
	session.post(r'http://localhost:5000/update/')


# parses user input for panel ordering (0-indexed)
def parse_ordering(inp, num_panels=None, default=None):
	# convert string to int
	def parse(x):
		# convert range
		if "-"  in x:
			split= x.split("-", maxsplit=1)
			start= int(split[0])
			end= int(split[1]) + 1
			return list(range(start, end))
		# else treat as single number
		else:
			return [int(x)]

	# inits
	ret= []

	# get numbers
	try:
		inp= inp.strip().split()
		for x in inp:
			ret+= parse(x)
	except ValueError:
		return None

	# auto-fill if empty input
	if ret == [] and default:
		ret= [int(x) for x in default]

	# check valid
	if num_panels is not None:
		# check valid indices
		if any(x >= num_panels for x in ret):
			return None
		# check has all indices
		if len(ret) != num_panels:
			return None

	# return
	return ret

# data sorting key
# use number of times verified and add this number to item
def sort_func(item):
	key= os.path.basename(item['file_path'])
	s= SEEN_DATA.setdefault(series, {})
	count= s.get(key, 0)

	item['seen_count']= count
	item['seen_key']= key

	return count

# helper function for preloading
def load_func(data_iter, index):
	item= data_iter[index]
	image= draw_item(item)
	string= image_to_base64(image)
	return string

if __name__ == "__main__":
	manager= multiprocessing.Manager()

	# load data
	data_iter= manager.list()
	for x in iter_data():
		data_iter.append(x)
		ts.log("Loading data...")
	print()

	print("Sorting data...")
	data_iter.sort(key=sort_func)

	print("Filtering data...")
	for x in list(data_iter):
		if x['data'].get('is_bad', False):
			data_iter.remove(x)

	# start image viewer
	print("Starting image viewer...")

	current_image= manager.Value(ctypes.c_char_p, "")
	disp_proc= multiprocessing.Process(target=DynamicPage.start, daemon=True, kwargs=dict(shared_image=current_image))
	disp_proc.start()

	webbrowser.open('http://127.0.0.1:5000/')

	# start process for preloading images
	load_lim= 5
	load_args= (data_iter,)

	preload_lst= PreloadedList(load_func, load_args)
	preload_lst.start()

	# loop images
	i=0
	disp_proc= None
	while i < len(data_iter):
		# inits
		item= data_iter[i]
		data= item['data']
		preload_lst.center(i, max_ind=len(data_iter), load_lim=load_lim)

		print(f"\n{os.path.basename(item['file_path'])} -- Verified {item['seen_count']} times.")

		# show image
		print(f'\rLoading data (i={i})...', end='')
		string= preload_lst.loaded.get(i, None)
		while string is None:
			if i in preload_lst.loaded:
				string= preload_lst.loaded[i]
			time.sleep(.5)
		print('\r', end='')
		update_image(string)

		# ask for new ordering
		inp= input('New ordering (leave blank to keep as-is) -- ').strip()
		order= parse_ordering(inp, num_panels=len(data['contours']), default=data['order'])

		keywords= [
			'p', # go to previous without editing data / seen stats
			'n', # got to next without editing data / seen stats
			'bad', # discard data -- in case bad segmentation or something
		]

		# if invalid input, try again
		while order is None and inp not in keywords:
			inp= input('Invalid ordering. Please try again. (leave blank to keep as-is) -- ').strip()
			order= parse_ordering(inp, num_panels=len(data['contours']), default=data['order'])

		if inp == 'p':
			i-=1
			continue
		elif inp == 'n':
			i+=1; continue
		elif inp == 'bad':
			print('Marking bad: ', item['file_path'])

			# modify file
			data['is_bad']= True
			utils.dump_json(data, item['file_path'])

			# remove from list
			del data_iter[i]
			preload_lst.remove(i, decrement=True)

			# continue
			continue

		# check for ordering changes
		if data['order'] != order:
			# debug print
			old_order= [int(x) for x in data['order']]
			old_order= " ".join(str(x) for x in old_order)
			new_order= " ".join(str(x) for x in order)
			print(f"[{old_order}] --> [{new_order}]")

			# save
			data['order']= [str(x) for x in order]
			utils.dump_json(data, item['file_path'])

		# increment verification count
		item['seen_count']+= 1
		SEEN_DATA[series][item['seen_key']]= item['seen_count']
		utils.dump_json(SEEN_DATA, "./verified.json")

		# go to next image
		i+=1
		continue