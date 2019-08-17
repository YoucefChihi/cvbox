(function () {
  const MAX_SIZE = 1024 * 1024 * 3;

  new ClipboardJS ('.cp-link-btn');

  $ ('.resume-help').hover (function () {
    $ ('.resume-help').removeClass ('animated');
  });
  resetLeaderBoard ();
  $ ('.check-status-overlay').click (function () {
    $ ('.check-status-feature').toggleClass ('active');
  });
  $ ('#check-status').click (function () {
    $ ('.check-status-feature').toggleClass ('active');
  });

  let interval = setInterval (function () {
    // console.log ('tick');
    if (Maitre) {
      if (Maitre.generate) {
        clearInterval (interval);
        let rewardsList = Maitre.generate.rewardsList ();
        $ ('.rewards').append (rewardsList);
      }
    }
  }, 500);

  $ ('#cv').change (function () {
    var filename = this.value.replace (/^.*[\\\/]/, '');
    if (filename) {
      if (this.files[0].size > MAX_SIZE) {
        displayFileError (true, 'The file is too large');
      } else {
        $ ('#filename').removeClass ('error');
        $ ('#filename').html (filename);
      }
    } else {
      $ ('#filename').html ('No file chosen');
    }
    // console.log (filename);
  });

  function displayFileError (isError, errorMsg) {
    if (isError) {
      $ ('#filename').addClass ('error');
      $ ('#filename').html (errorMsg);
    } else {
      $ ('#filename').removeClass ('error');
    }
  }

  $ ('#contact-form').submit (function (e) {
    e.preventDefault ();
    var file = document.getElementById ('cv').files[0];
    if (!file) {
      // $ ('#filename').addClass ('error');
      // $ ('#filename').html ('This field is required');
      displayFileError (true, 'This field is required');
    } else if (file.size > MAX_SIZE) {
      displayFileError (true, 'The file is too large');
    } else {
      // $ ('#filename').removeClass ('error');
      displayFileError (false);
      var formData = new FormData ();
      var params = new URLSearchParams (window.location.search);
      var name = $ ('#contact-form-name').val ();
      var email = $ ('#contact-form-email').val ();
      var mwr = params.get ('mwr');
      // var mwr = $.url ('?search');
      formData.append ('cv', file);
      formData.append ('name', name);
      formData.append ('email', email);
      formData.append ('mwr', mwr);

      var xhr = new XMLHttpRequest ();
      // console.log ('disableForm true');
      disableForm (true);
      xhr.open ('post', '/subscribers', true);

      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          var percentage = e.loaded / e.total * 100;
          // $('div.progress div.bar').css('width', percentage + '%');
          // console.log (percentage);
        }
      };

      xhr.onerror = function (e) {
        console.log ('disableForm false');
        disableForm (false);
        console.log (
          'An error occurred while submitting the form. Maybe your file is too big'
        );
      };
      setLoading (true);

      xhr.onload = function () {
        const status = this.status;
        setLoading (false);
        try {
          if (status === 400) {
            displayFileError (true, 'PDF files only');
            disableForm (false);
          } else {
            let subObj = JSON.parse (this.response);
            if (subObj.invalidFile) {
              displayFileError (true, 'Invalid PDF file');
            }
            if (subObj.alreadySub) {
              let referralLink = subObj.data.host + '/?mwr=' + subObj.data.code;
              updateSocialLinks (referralLink);
              $ ('#link').html (referralLink);
              $ ('.hwd').toggleClass ('done');
              $ ('.swd').toggleClass ('done');
              $ ('.referral-link .link-cp').css ('display', 'inline-block');
              $ ('.referral-link .cp-link-btn').css ('display', 'inline-block');
            } else if (subObj.newSub) {
              let referralLink = subObj.data.host + '/?mwr=' + subObj.data.code;
              updateSocialLinks (referralLink);
              $ ('.hwd').toggleClass ('done');
              $ ('.swd').toggleClass ('done');
              $ ('.referral-link .link-cp').css ('display', 'inline-block');
              $ ('.referral-link .cp-link-btn').css ('display', 'inline-block');
            }
            // console.log ('disableForm false');
            disableForm (false);
          }
        } catch (error) {
          // console.log(error)
          console.log ('error loading/parsing xhr');
          console.log ('disableForm false');
          disableForm (false);
        }
      };

      xhr.send (formData);
    }
  });

  $ ('#check-status-form').submit (function (e) {
    e.preventDefault ();
    var email = $ ('#check-status-form-email').val ();
    $.post ('/subscribers/check', {email: email}, function (response) {
      if (!response.found) {
        let mailCheckMsg = "Vous n'êtes pas encore inscrit!";
        resetLeaderBoard ();
        setMailCheckMsg (mailCheckMsg);
        $ ('.check-status-container').removeClass ('filled');
      } else {
        let subObj = response.data;
        let referralLink = subObj.host + '/?mwr=' + subObj.code;
        let mailCheckMsg =
          'Vous êtes à la <b>position numéro: ' +
          subObj.position +
          '</b> avec <b>' +
          subObj.points +
          ' points!</b> <br> Parrainez vos amis et collectez plus de points.';
        resetLeaderBoard ();
        setLeaderboardReferralLink (referralLink);
        setMailCheckMsg (mailCheckMsg);
        showLeaderboard ();
        updateTopSubs (subObj.topSubs);
        $ ('.check-status-container').addClass ('filled');
      }
    });
  });

  function updateTopSubs (topSubs) {
    let $rows = [
      $ ('.top-3 .rw:nth-child(2)'),
      $ ('.top-3 .rw:nth-child(3)'),
      $ ('.top-3 .rw:nth-child(4)'),
    ];
    for (let i = 0; i < topSubs.length; i++) {
      const sub = topSubs[i];
      let $cols = $rows[i].find ('.col');
      $ ($cols[0]).text (sub.position);
      $ ($cols[1]).text (sub.email);
      $ ($cols[2]).text (sub.points);
    }
  }

  function setLoading (isLoading) {
    if (isLoading) {
      $ ('#page-loader').removeClass ('hide-this');
    } else {
      $ ('#page-loader').addClass ('hide-this');
    }
  }
  function disableForm (isDisabled) {
    var name = $ ('#contact-form-name').attr ('disabled', isDisabled);
    var email = $ ('#contact-form-email').attr ('disabled', isDisabled);
    var cv = $ ('#cv').attr ('disabled', isDisabled);
    var butn = $ ('#contact-form button').attr ('disabled', isDisabled);
  }

  function updateSocialLinks (referralLink) {
    let shareFb =
      'https://www.facebook.com/sharer/sharer.php?u=' + referralLink;
    let shareTw = 'http://twitter.com/share?&url=' + referralLink;
    $ ('.share-fb').attr ('href', shareFb);
    $ ('meta[property="og:url"]').attr ('href', shareFb);
    $ ('.share-tw').attr ('href', shareTw);
    // $ ('#lb-link').html (link);

    $ ('#link').val (referralLink);
    $ ('#link-lb').val (referralLink);
  }

  function resetLeaderBoard () {
    $ ('#mail-check-msg').css ('display', 'none');
    $ ('#lb-link').css ('display', 'none');
    $ ('.leader-board').css ('display', 'none');
    $ ('.check-status-container .social-icons').css ('display', 'none');
    $ ('.link-cp').css ('display', 'none');
    $ ('.cp-link-btn').css ('display', 'none');
  }

  function setMailCheckMsg (msg) {
    $ ('#mail-check-msg').css ('display', 'block');
    $ ('#mail-check-msg').html (msg);
  }

  function setLeaderboardReferralLink (link) {
    $ ('#lb-link').css ('display', 'block');
    $ ('.check-status-container .social-icons').css ('display', 'block');
    $ ('.link-cp').css ('display', 'inline-block');
    $ ('.cp-link-btn').css ('display', 'inline-block');
    updateSocialLinks (link);
  }

  function showLeaderboard () {
    $ ('.leader-board').css ('display', 'block');
  }
}) ();
