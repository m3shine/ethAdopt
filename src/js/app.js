App = {
    web3Provider: null,
    contracts: {},

    init: function () {
        // Load pets.
        $.getJSON('../pets.json', function (data) {
            var petsRow = $('#petsRow');
            var petTemplate = $('#petTemplate');

            for (i = 0; i < data.length; i++) {
                petTemplate.find('.panel-title').text(data[i].name);
                petTemplate.find('img').attr('src', data[i].picture);
                petTemplate.find('.pet-breed').text(data[i].breed);
                petTemplate.find('.pet-age').text(data[i].age);
                petTemplate.find('.pet-location').text(data[i].location);
                petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

                petsRow.append(petTemplate.html());
            }
        });
        return App.initWeb3();
    },

    initWeb3: function () {

        // Is there an injected web3 instance?
        // 这里是判断否已存在web3，比如，如果是用户登录MetaMask连接到本网络，则web3是MetaMask的web3。
        // MetaMask创建的账户由MetaMask维护，而导入的账户则每次登录MetaMask都需要重新导入。
        // 否则就创建一个web3，这就可能需要自行实现钱包让用户登录了。
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // 此处要用web3.providers
            App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
        }

        // App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
        web3 = new Web3(App.web3Provider);
        return App.initTokenSB();
        //return App.initContract();
    },

    initContract: function () {
        $.getJSON('Adoption.json', function (data) {
            // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
            var AdoptionArtifact = data;
            App.contracts.Adoption = TruffleContract(AdoptionArtifact);
            App.contracts.Adoption.setProvider(App.web3Provider);
            return App.markAdopted();
        })

        return App.bindEvents();
    },
    initTokenSB: function () {
        $.getJSON('TokenSB.json', function (data) {
            var TokenArtifact = data;
            App.contracts.Token = TruffleContract(TokenArtifact);
            App.contracts.Token.setProvider(App.web3Provider);
        }).then(function () {
            $(document).load(App.initMyAccounts())
        })

        return App.bindTransfer();
    },
    //初始化我的钱包账户
    initMyAccounts: function () {
        console.log(web3.version)
        // MetaMask不支持同步方法，所以需要用异步调用，也就是带回调函参的方式
        web3.eth.getBalance(web3.eth.accounts[0], function (err, balance) {
            console.log(balance)
        })
        App.contracts.Token.deployed().then(function (instance) {
            //初始化我的账户
            $('#myAddress').html(web3.eth.accounts)

            var symbol;
            instance.symbol().then(function (value) {
                symbol = value;
                instance.balanceOf(web3.eth.accounts[0]).then(function (value) {
                    $('#balance').html(value.c[0] + ' ' + symbol)
                })
            })
        })
    },
    //绑定领养事件
    bindEvents: function () {
        $(document).on('click', '.btn-adopt', App.handleAdopt);
    },
    // 绑定转账事件
    bindTransfer: function () {
        $(document).on('click', '#transfer', App.TransferSB);
    },
    //标记已领养
    markAdopted: function (adopters, account) {
        var adoptionInstance;
        App.contracts.Adoption.deployed().then(function (instance) {
            adoptionInstance = instance;
            return adoptionInstance.getAdopters.call();
        }).then(function (adopters) {
            for (i = 0; i < adopters.length; i++) {
                if (adopters[i] !== 0x0) {
                    $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
                }
            }
        }).catch(function (err) {
            console.log(err.message);
        });
    },
    //领养
    handleAdopt: function (event) {
        event.preventDefault();

        var petId = parseInt($(event.target).data('id'));

        var adoptionInstance;

        // 获取用户账号
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.Adoption.deployed().then(function (instance) {
                adoptionInstance = instance;
                // 发送交易领养宠物
                return adoptionInstance.adopt(petId, {from: account});
            }).then(function (result) {
                console.log(result)
                return App.markAdopted();
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    },
    //转账
    TransferSB: function (event) {
        event.preventDefault();
        var receipt = $('#receipt');
        var amount = $('#tokenAmount');
        var tokenInstance
        App.contracts.Token.deployed().then(function (instance) {
            tokenInstance = instance;
            tokenInstance.transfer(receipt, amount)
        }).then(function (result) {
        }).catch(function (err) {
            console.log(err.message);
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
