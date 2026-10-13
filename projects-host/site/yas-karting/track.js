(()=>{
const dry = `M165 137
C245 137 315 164 422 164
C473 164 494 151 525 131
C549 116 574 91 602 88
C640 86 691 134 690 199
C690 220 704 234 704 254
C707 271 681 307 637 340
C607 362 581 346 581 326
C577 315 582 305 597 294
C617 279 640 273 638 250
C648 212 620 177 590 182
C567 188 554 207 536 221
C514 237 483 252 483 293
C482 302 481 307 481 314
C481 337 506 359 506 382
C507 414 490 441 468 449
C442 459 431 478 390 481
C321 484 232 485 165 491
C117 495 97 473 91 445
C86 420 64 403 68 376
L68 339
C68 316 89 311 108 299
C130 285 153 273 204 273
L285 273
C326 273 348 289 348 313
C348 329 336 335 322 341
C303 350 271 359 249 352
C232 344 214 335 196 335
C157 328 143 350 144 378
C144 391 154 396 165 399
C184 415 217 427 254 427
C298 425 350 420 380 413
C401 405 402 391 405 378
C410 360 424 339 424 302
C424 269 418 254 391 242
C370 228 346 202 304 202
C254 202 220 208 171 221
C134 229 86 228 62 217
C39 208 38 185 57 173
C65 168 70 164 75 160
C95 149 130 137 165 137 Z`;
const wet = `M165 151
C281 151 382 143 439 146
C487 150 504 149 532 143
C554 136 578 100 610 103
C659 95 708 136 710 182
C714 220 709 259 689 289
C670 316 640 347 610 350
C582 358 565 344 566 325
C568 296 621 280 625 251
C640 209 617 178 585 182
C543 189 509 221 495 267
C473 308 499 333 494 375
C498 414 505 434 478 460
C452 473 422 478 390 479
C287 488 198 467 135 469
C109 471 78 461 77 433
C64 405 89 367 88 335
C85 312 88 278 118 274
C177 272 239 292 292 288
C330 283 348 300 348 321
C348 343 328 362 302 365
C248 370 211 360 181 355
C150 350 144 360 144 382
C143 411 153 430 177 430
C238 435 278 411 329 406
C368 405 402 417 418 392
C432 368 410 332 411 298
C410 267 415 232 384 222
C355 210 322 226 285 226
C217 226 151 213 92 205
C65 201 44 207 34 184
C25 162 53 139 78 137
C110 132 137 148 165 151 Z`;
const turns = [
{n:1,name:'Left kink',label:[475,101],apex:[525,131],box:[405,75,215,135],dry:'Right approach → left apex → hold left for the right sweeper.',wet:'Miss the rubbered left apex; use a shallower line where the asphalt grips.'},
{n:2,name:'Outer right sweep',label:[747,154],apex:[690,199],box:[563,68,190,240],dry:'Left entry → right apex in the latter half → open left, then prepare for T3.',wet:'Try a wider arc outside the dry apex; avoid the outer edge if water collects there.'},
{n:3,name:'Lower right hairpin',label:[647,388],apex:[581,314],box:[548,266,169,113],dry:'Left entry → late right apex → restrained exit to prepare for the left turn.',wet:'Try the wider outer arc, missing the dry apex; cross rubber with gentle inputs.'},
{n:4,name:'Inner left return',label:[574,179],apex:[536,221],box:[458,180,212,180],dry:'Right entry → left apex → open right, then move left for T5 when straight.',wet:'Stay outside the shiny apex line on the upper arc; choose the cleanest exit strip.'},
{n:5,name:'Right onto bottom straight',label:[539,459],apex:[478,444],box:[390,348,153,159],dry:'Left entry → slightly late right apex → open left onto the straight.',wet:'Brake off the rubber; try the wider arc and straighten before building throttle.'},
{n:6,name:'Bottom-left right',label:[35,483],apex:[92,445],box:[32,389,178,126],dry:'Left entry → right apex → exit left to set up the next right.',wet:'Use a broader arc away from the dry apex, provided the outside drains well.'},
{n:7,name:'Right into infield',label:[42,284],apex:[108,299],box:[35,252,190,131],dry:'Left entry → right apex → open left for the next right hairpin.',wet:'Try the outer arc away from the inside rubber; keep the transition smooth.'},
{n:8,name:'Infield right hairpin',label:[382,314],apex:[330,337],box:[249,254,136,138],dry:'Left entry → right apex → limit exit width and prepare right for T9.',wet:'Miss the dry apex with a wider arc; prioritize grip while changing direction.'},
{n:9,name:'Infield left hairpin',label:[110,387],apex:[165,399],box:[116,310,151,137],dry:'Right entry → late left apex → open right along the short straight.',wet:'Try a wider arc off the polished apex; wait for traction before accelerating.'},
{n:10,name:'Central left, lower',label:[455,394],apex:[405,378],box:[344,338,116,115],dry:'Right entry → left apex → open right, ready for the next left.',wet:'Stay off the dry apex and leave room for understeer; the next bend limits exit width.'},
{n:11,name:'Central left, upper',label:[454,244],apex:[391,242],box:[326,185,134,137],dry:'Right entry → left apex → open right, then move left for the final hairpin.',wet:'Brake on clean asphalt; miss the dry apex and avoid powering across shiny rubber.'},
{n:12,name:'Final right hairpin',label:[24,123],apex:[75,160],box:[16,109,198,146],dry:'Left entry → late right apex → open left onto the top straight.',wet:'Use the outside arc only if it grips; straighten the exit and feed in throttle.'}
];

window.YAS = {dry,wet,turns};

})();
